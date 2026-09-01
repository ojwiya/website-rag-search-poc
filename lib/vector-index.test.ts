import { describe, it, expect } from 'vitest';
import {
  cosineSparse,
  encodeQuery,
  rankByVector,
  type VectorIndex,
} from './vector-index';

function idx(partial: Partial<VectorIndex> & Pick<VectorIndex, 'vocab' | 'idf' | 'ids' | 'vectors'>): VectorIndex {
  return { model: 'tfidf-l2', dim: partial.vocab.length, ...partial };
}

describe('cosineSparse', () => {
  it('is 1 for identical unit vectors and 0 for orthogonal', () => {
    expect(cosineSparse([0, 1], [0.6, 0.8], [0, 1], [0.6, 0.8])).toBeCloseTo(1, 5);
    expect(cosineSparse([0], [1], [1], [1])).toBeCloseTo(0, 5);
  });
});

describe('encodeQuery + rankByVector', () => {
  const index = idx({
    vocab: ['pool', 'garden', 'valencia'],
    idf: [1.5, 1.2, 2.0],
    ids: [10, 20],
    vectors: [
      { i: [0], w: [1] }, // pool
      { i: [1], w: [1] }, // garden
    ],
  });

  it('ranks the pool document first for query "pool"', () => {
    const q = encodeQuery('villa with pool', index);
    const ranked = rankByVector([10, 20], q, index);
    expect(ranked[0].id).toBe(10);
    expect(ranked[0].cosine).toBeGreaterThan(ranked[1].cosine);
  });

  it('returns empty cosine list for ids missing from the index', () => {
    const q = encodeQuery('pool', index);
    expect(rankByVector([99], q, index)).toEqual([]);
  });
});
