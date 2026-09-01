#!/usr/bin/env python3
"""Full-result correctness probe against a running /api/properties.

Unlike run_search_evals.py this paginates the entire result set and requires
100% of returned rows to satisfy structured constraints (price/beds/country/
AND keywords). It does not replace goldens; it is a stricter audit.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from typing import Any, Callable

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:3002").rstrip("/")
PAGE = 100


def fetch_all(q: str) -> tuple[int, list[dict[str, Any]]]:
    props: list[dict[str, Any]] = []
    page = 1
    total = 0
    while True:
        qs = urllib.parse.urlencode({"q": q, "limit": str(PAGE), "page": str(page)})
        url = f"{BASE}/api/properties?{qs}"
        with urllib.request.urlopen(url, timeout=120) as r:
            data = json.loads(r.read().decode())
        total = int(data.get("total") or 0)
        batch = data.get("properties") or []
        props.extend(batch)
        if not data.get("hasMore") or not batch:
            break
        page += 1
        if page > 200:
            break
    return total, props


def hay(p: dict[str, Any]) -> str:
    return " ".join(
        str(p.get(k) or "")
        for k in ("title", "locationName", "description", "country_slug")
    ).lower()


Check = Callable[[dict[str, Any]], bool]

CASES: list[dict[str, Any]] = [
    {
        "id": "under-300k",
        "q": "apartment under €300,000",
        "checks": {
            "price<=300k": lambda p: p.get("price", 0) <= 300000,
            "type-apartment": lambda p: "apartment" in (p.get("title") or "").lower(),
        },
    },
    {
        "id": "less-than-300k",
        "q": "apartment less than €300,000",
        "checks": {
            "price<=300k": lambda p: p.get("price", 0) <= 300000,
            "type-apartment": lambda p: "apartment" in (p.get("title") or "").lower(),
        },
    },
    {
        "id": "cheaper-than-300k",
        "q": "apartment cheaper than 300k",
        "checks": {
            "price<=300k": lambda p: p.get("price", 0) <= 300000,
        },
    },
    {
        "id": "up-to-300k",
        "q": "apartment up to €300,000",
        "checks": {
            "price<=300k": lambda p: p.get("price", 0) <= 300000,
        },
    },
    {
        "id": "between-200-400k",
        "q": "house between 200k and 400k",
        "checks": {
            "price>=200k": lambda p: p.get("price", 0) >= 200000,
            "price<=400k": lambda p: p.get("price", 0) <= 400000,
        },
    },
    {
        "id": "from-to-200-400k",
        "q": "house from 200k to 400k",
        "checks": {
            "price>=200k": lambda p: p.get("price", 0) >= 200000,
            "price<=400k": lambda p: p.get("price", 0) <= 400000,
        },
    },
    {
        "id": "dash-200-400k",
        "q": "house 200k-400k",
        "checks": {
            "price>=200k": lambda p: p.get("price", 0) >= 200000,
            "price<=400k": lambda p: p.get("price", 0) <= 400000,
        },
    },
    {
        "id": "over-1.2m",
        "q": "villa over 1.2m",
        "checks": {
            "price>=1.2m": lambda p: p.get("price", 0) >= 1_200_000,
        },
    },
    {
        "id": "cheap-france",
        "q": "cheap house in France",
        "checks": {
            "france": lambda p: p.get("country_slug") == "france",
            "price<=250k": lambda p: p.get("price", 0) <= 250000,
        },
    },
    {
        "id": "luxury-villa",
        "q": "luxury villa",
        "checks": {
            "price>=1m": lambda p: p.get("price", 0) >= 1_000_000,
        },
    },
    {
        "id": "exact-3-spain",
        "q": "3 bedroom house spain",
        "checks": {
            "spain": lambda p: p.get("country_slug") == "spain",
            "beds==3-or-null": lambda p: p.get("bedrooms") in (None, 3),
            "beds==3-when-known": lambda p: p.get("bedrooms") is None or p.get("bedrooms") == 3,
        },
    },
    {
        "id": "exact-2br",
        "q": "2br apartment",
        "checks": {
            "beds==2-when-known": lambda p: p.get("bedrooms") is None or p.get("bedrooms") == 2,
        },
    },
    {
        "id": "at-least-3-spain",
        "q": "at least 3 bedroom house spain",
        "checks": {
            "spain": lambda p: p.get("country_slug") == "spain",
            "beds>=3-when-known": lambda p: p.get("bedrooms") is None or p.get("bedrooms") >= 3,
        },
    },
    {
        "id": "plus-3-spain",
        "q": "3+ bedroom house spain",
        "checks": {
            "spain": lambda p: p.get("country_slug") == "spain",
            "beds>=3-when-known": lambda p: p.get("bedrooms") is None or p.get("bedrooms") >= 3,
        },
    },
    {
        "id": "less-than-4-beds-spain",
        "q": "less than 4 bedrooms spain",
        "checks": {
            "spain": lambda p: p.get("country_slug") == "spain",
            "beds<=3-when-known": lambda p: p.get("bedrooms") is None or p.get("bedrooms") <= 3,
        },
    },
    {
        "id": "under-4-beds-spain",
        "q": "under 4 bedrooms spain",
        "checks": {
            "spain": lambda p: p.get("country_slug") == "spain",
            "beds<=4-when-known": lambda p: p.get("bedrooms") is None or p.get("bedrooms") <= 4,
        },
    },
    {
        "id": "between-2-4-beds-spain",
        "q": "between 2 and 4 bedrooms spain",
        "checks": {
            "spain": lambda p: p.get("country_slug") == "spain",
            "beds-2-4-when-known": lambda p: p.get("bedrooms") is None
            or (2 <= p.get("bedrooms") <= 4),
        },
    },
    {
        "id": "more-than-3-beds-spain",
        "q": "more than 3 bedrooms spain",
        "checks": {
            "spain": lambda p: p.get("country_slug") == "spain",
            "beds>=4-when-known": lambda p: p.get("bedrooms") is None or p.get("bedrooms") >= 4,
        },
    },
    {
        "id": "3bed-italy-pool",
        "q": "3-bed villa with pool in Italy",
        "checks": {
            "italy": lambda p: p.get("country_slug") == "italy",
            "beds==3-when-known": lambda p: p.get("bedrooms") is None or p.get("bedrooms") == 3,
            "villa": lambda p: "villa" in hay(p),
            "pool": lambda p: "pool" in hay(p),
        },
    },
    {
        "id": "valencia",
        "q": "house in valencia",
        "checks": {
            "valencia-in-text": lambda p: "valencia" in hay(p),
        },
    },
    {
        "id": "costa-pool",
        "q": "Villa with pool, Costa del Sol",
        "checks": {
            "villa": lambda p: "villa" in hay(p),
            "pool": lambda p: "pool" in hay(p),
            "costa-or-sol": lambda p: "costa" in hay(p) or "sol" in hay(p),
        },
    },
    {
        "id": "affordable-pt",
        "q": "affordable apartment portugal",
        "checks": {
            "portugal": lambda p: p.get("country_slug") == "portugal",
            "price<=250k": lambda p: p.get("price", 0) <= 250000,
        },
    },
]


def main() -> int:
    failed = 0
    print(f"BASE_URL={BASE}")
    for case in CASES:
        q = case["q"]
        try:
            total, props = fetch_all(q)
        except Exception as e:
            print(f"ERROR {case['id']}: {e}")
            failed += 1
            continue
        reasons: list[str] = []
        if total == 0 or not props:
            reasons.append(f"empty total={total} fetched={len(props)}")
        if total != len(props):
            reasons.append(f"fetched {len(props)} != total {total}")
        for name, fn in case["checks"].items():
            bad = [p for p in props if not fn(p)]
            if bad:
                sample = bad[0]
                reasons.append(
                    f"{name}: {len(bad)}/{len(props)} e.g. id={sample.get('id')} "
                    f"price={sample.get('price')} beds={sample.get('bedrooms')} "
                    f"country={sample.get('country_slug')} title={sample.get('title')!r}"
                )
        ok = not reasons
        status = "PASS" if ok else "FAIL"
        print(f"{status} {case['id']}: total={total} fetched={len(props)} q={q!r}")
        for r in reasons:
            print(f"      {r}")
        if not ok:
            failed += 1
    print(f"\n{len(CASES) - failed}/{len(CASES)} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
