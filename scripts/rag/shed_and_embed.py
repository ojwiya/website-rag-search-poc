#!/usr/bin/env python3
"""Restore the full M0 snapshot, build a local TF-IDF fallback, and ingest Zilliz.

Search source of truth is Zilliz/Milvus (BM25 sparse + scalar filters). The Vercel
function does not ship ChromaDB. Query-time embeddings are BM25 on the cluster
(send raw residual text — no MiniLM/OpenAI weights on Vercel).

Local TF-IDF (`rag/vector-index.json`) remains the offline fallback so `npm test`
works without ZILLIZ_TOKEN.

Env:
  ZILLIZ_URI   default https://in03-c1d6d9a951a5528.serverless.aws-eu-central-1.cloud.zilliz.com
  ZILLIZ_TOKEN required for live upsert (never commit)
  ZILLIZ_COLLECTION  default listings

Usage:
  python3 scripts/rag/shed_and_embed.py
  npm run embed

Loads repo-root `.env.local` automatically (does not override vars already in the shell).
"""
from __future__ import annotations

import json
import math
import os
import re
import sys
from collections import Counter
from pathlib import Path

from env_local import load_env_local

ROOT = Path(__file__).resolve().parents[2]
RAG = ROOT / "rag"
SRC = RAG / "properties_data.json"
FULL = RAG / "properties_data.full.json"
INDEX = RAG / "vector-index.json"

DEFAULT_URI = (
    "https://in03-c1d6d9a951a5528.serverless.aws-eu-central-1.cloud.zilliz.com"
)
DEFAULT_COLLECTION = "listings"
VOCAB_SIZE = 3000
TOKEN_RE = re.compile(r"[a-z0-9]+")
TEXT_MAX = 8000
INSERT_BATCH = 64


def tokenize(text: str) -> list[str]:
    return [t for t in TOKEN_RE.findall(text.lower()) if len(t) > 2]


def doc_text(p: dict) -> str:
    parts = [
        f"Property: {p.get('title', '')}",
        f"Country: {str(p.get('country_slug', '')).title()}",
        f"Location: {p.get('locationName', '')}",
        f"Price: {p.get('price', 0)}",
    ]
    if p.get("bedrooms"):
        parts.append(f"Bedrooms: {p['bedrooms']}")
    if p.get("bathrooms"):
        parts.append(f"Bathrooms: {p['bathrooms']}")
    desc = (p.get("description") or "")[:800]
    if desc:
        parts.append(f"Description: {desc}")
    return "\n".join(parts)


def milvus_text(p: dict) -> str:
    parts = [
        f"Property: {p.get('title', '')}",
        f"Country: {str(p.get('country_slug', '')).title()}",
        f"Location: {p.get('locationName', '')}",
        f"Price: {p.get('price', 0)}",
    ]
    if p.get("bedrooms"):
        parts.append(f"Bedrooms: {p['bedrooms']}")
    desc = p.get("description") or ""
    if desc:
        parts.append(f"Description: {desc}")
    text = "\n".join(parts)
    return text[:TEXT_MAX]


def load_snapshot() -> tuple[list[dict], dict]:
    if FULL.exists():
        data = json.loads(FULL.read_text())
        print(f"loaded full snapshot from {FULL} ({len(data['properties'])} listings)")
        return data["properties"], data
    data = json.loads(SRC.read_text())
    props = data["properties"]
    FULL.write_text(json.dumps(data))
    print(f"backed up {len(props)} listings -> {FULL}")
    return props, data


def write_hydration(props: list[dict], meta: dict) -> None:
    countries = Counter(p.get("country_slug") for p in props)
    out = {
        "total": len(props),
        "country_distribution": dict(countries),
        "properties": props,
    }
    if "shed_from" in meta:
        # Drop the Vercel-sized shed marker; this file is the full corpus.
        pass
    SRC.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {len(props)} listings -> {SRC} ({SRC.stat().st_size / 1e6:.1f} MB)")


def build_index(props: list[dict]) -> dict:
    docs = [tokenize(doc_text(p)) for p in props]
    df: Counter[str] = Counter()
    for toks in docs:
        df.update(set(toks))
    vocab = [t for t, _ in df.most_common(VOCAB_SIZE)]
    vocab_index = {t: i for i, t in enumerate(vocab)}
    n = len(docs)
    idf = [math.log((n + 1) / (df[t] + 1)) + 1.0 for t in vocab]
    vectors = []
    ids = []
    for p, toks in zip(props, docs):
        tf: Counter[int] = Counter()
        for t in toks:
            idx = vocab_index.get(t)
            if idx is not None:
                tf[idx] += 1
        i_list = []
        w_list = []
        n2 = 0.0
        for idx, count in sorted(tf.items()):
            w = count * idf[idx]
            i_list.append(idx)
            w_list.append(w)
            n2 += w * w
        norm = math.sqrt(n2) or 1.0
        w_list = [round(w / norm, 6) for w in w_list]
        ids.append(p["id"])
        vectors.append({"i": i_list, "w": w_list})
    return {
        "model": "tfidf-l2",
        "dim": len(vocab),
        "vocab": vocab,
        "idf": [round(x, 6) for x in idf],
        "ids": ids,
        "vectors": vectors,
    }


def skip_milvus(reason: str) -> None:
    uri = os.environ.get("ZILLIZ_URI", DEFAULT_URI)
    print(f"skip Milvus upsert: {reason}")
    print("  env + command for live ingest:")
    print(f"    ZILLIZ_URI={uri}")
    print("  put ZILLIZ_TOKEN in repo-root .env.local, or export it, then:")
    print("    pip install pymilvus")
    print("    python3 scripts/rag/shed_and_embed.py")


def milvus_row(p: dict) -> dict:
    bedrooms = p.get("bedrooms")
    row = {
        "id": int(p["id"]),
        "text": milvus_text(p),
        "price": int(p.get("price") or 0),
        "country": str(p.get("country_slug") or ""),
    }
    if bedrooms is None:
        row["bedrooms"] = None
    else:
        row["bedrooms"] = int(bedrooms)
    return row


def upsert_milvus(props: list[dict]) -> None:
    token = (os.environ.get("ZILLIZ_TOKEN") or "").strip()
    if not token:
        skip_milvus("ZILLIZ_TOKEN is not set")
        return
    try:
        from pymilvus import DataType, Function, FunctionType, MilvusClient
    except ImportError:
        skip_milvus("pymilvus is not installed")
        return

    uri = os.environ.get("ZILLIZ_URI", DEFAULT_URI).rstrip("/")
    name = os.environ.get("ZILLIZ_COLLECTION", DEFAULT_COLLECTION)
    client = MilvusClient(uri=uri, token=token)

    schema = client.create_schema()
    schema.add_field(field_name="id", datatype=DataType.INT64, is_primary=True, auto_id=False)
    schema.add_field(
        field_name="text",
        datatype=DataType.VARCHAR,
        max_length=65535,
        enable_analyzer=True,
    )
    schema.add_field(field_name="sparse", datatype=DataType.SPARSE_FLOAT_VECTOR)
    schema.add_field(field_name="price", datatype=DataType.INT64)
    schema.add_field(field_name="bedrooms", datatype=DataType.INT64, nullable=True)
    schema.add_field(field_name="country", datatype=DataType.VARCHAR, max_length=64)
    schema.add_function(
        Function(
            name="text_bm25",
            input_field_names=["text"],
            output_field_names=["sparse"],
            function_type=FunctionType.BM25,
        )
    )

    index_params = client.prepare_index_params()
    index_params.add_index(field_name="sparse", index_type="AUTOINDEX", metric_type="BM25")

    if client.has_collection(name):
        print(f"dropping existing collection {name}")
        client.drop_collection(name)
    client.create_collection(collection_name=name, schema=schema, index_params=index_params)
    print(f"created collection {name} on {uri}")

    rows = [milvus_row(p) for p in props]
    inserted = 0
    for i in range(0, len(rows), INSERT_BATCH):
        batch = rows[i : i + INSERT_BATCH]
        client.insert(collection_name=name, data=batch)
        inserted += len(batch)
        if inserted == len(rows) or inserted % 512 == 0:
            print(f"  upserted {inserted}/{len(rows)}")
    print(f"upserted {inserted} listings into {name}")


def main() -> int:
    loaded = load_env_local()
    if loaded:
        print(f"loaded env from {loaded}")
    props, meta = load_snapshot()
    write_hydration(props, meta)
    index = build_index(props)
    INDEX.write_text(json.dumps(index, separators=(",", ":")))
    print(f"wrote local TF-IDF fallback -> {INDEX} ({INDEX.stat().st_size / 1e6:.1f} MB)")
    upsert_milvus(props)
    return 0


if __name__ == "__main__":
    sys.exit(main())
