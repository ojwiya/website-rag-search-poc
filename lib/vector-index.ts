/** Compact TF-IDF vector index — Chroma-equivalent retrieval without the 101MB store. */

export type SparseVec = { i: number[]; w: number[] };

export type VectorIndex = {
  model: string;
  dim: number;
  vocab: string[];
  idf: number[];
  ids: number[];
  vectors: SparseVec[];
};

const TOKEN_RE = /[a-z0-9]+/g;

export function tokenize(text: string): string[] {
  const out: string[] = [];
  const lower = text.toLowerCase();
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(lower))) {
    if (m[0].length > 2) out.push(m[0]);
  }
  return out;
}

export function cosineSparse(
  ai: number[],
  aw: number[],
  bi: number[],
  bw: number[]
): number {
  const bMap = new Map<number, number>();
  let nb = 0;
  for (let k = 0; k < bi.length; k++) {
    bMap.set(bi[k], bw[k]);
    nb += bw[k] * bw[k];
  }
  let dot = 0;
  let na = 0;
  for (let k = 0; k < ai.length; k++) {
    na += aw[k] * aw[k];
    const bv = bMap.get(ai[k]);
    if (bv != null) dot += aw[k] * bv;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function encodeQuery(text: string, index: VectorIndex): SparseVec {
  const vocabIndex = new Map<string, number>();
  for (let i = 0; i < index.vocab.length; i++) vocabIndex.set(index.vocab[i], i);
  const tf = new Map<number, number>();
  for (const tok of tokenize(text)) {
    const idx = vocabIndex.get(tok);
    if (idx === undefined) continue;
    tf.set(idx, (tf.get(idx) || 0) + 1);
  }
  const i: number[] = [];
  const w: number[] = [];
  let n2 = 0;
  for (const [idx, count] of tf) {
    const weight = count * index.idf[idx];
    i.push(idx);
    w.push(weight);
    n2 += weight * weight;
  }
  const n = Math.sqrt(n2);
  if (n > 0) {
    for (let k = 0; k < w.length; k++) w[k] /= n;
  }
  return { i, w };
}

export function rankByVector(
  ids: number[],
  query: SparseVec,
  index: VectorIndex
): Array<{ id: number; cosine: number }> {
  const pos = new Map<number, number>();
  for (let k = 0; k < index.ids.length; k++) pos.set(index.ids[k], k);
  const out: Array<{ id: number; cosine: number }> = [];
  for (const id of ids) {
    const row = pos.get(id);
    if (row === undefined) continue;
    const vec = index.vectors[row];
    out.push({
      id,
      cosine: cosineSparse(query.i, query.w, vec.i, vec.w),
    });
  }
  out.sort((a, b) => b.cosine - a.cosine);
  return out;
}

let _index: VectorIndex | null | undefined;

export function loadVectorIndex(): VectorIndex | null {
  if (_index !== undefined) return _index;
  try {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'rag', 'vector-index.json');
    if (!fs.existsSync(dataPath)) {
      _index = null;
      return null;
    }
    _index = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as VectorIndex;
    return _index;
  } catch {
    _index = null;
    return null;
  }
}

/** Test-only: reset the module cache. */
export function _resetVectorIndexCache() {
  _index = undefined;
}
