import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { loadProperties, searchProperties } from './rag';

const spec = JSON.parse(
  readFileSync(path.join(process.cwd(), 'docs', 'agent-ops', 'golden-queries.json'), 'utf-8')
) as {
  queries: Array<{
    id: string;
    q: string;
    expect?: {
      minTotal?: number;
      maxTotal?: number;
      maxPrice?: number;
      beds?: number;
    };
  }>;
};

describe('golden NL queries (corpus)', () => {
  const all = loadProperties();

  for (const q of spec.queries) {
    it(`${q.id}: ${q.q}`, () => {
      const sample = searchProperties(all, q.q, 50);
      const full = searchProperties(all, q.q, 1_000_000);
      const exp = q.expect || {};
      if (exp.minTotal != null) expect(full.length).toBeGreaterThanOrEqual(exp.minTotal);
      if (exp.maxTotal != null) expect(full.length).toBeLessThanOrEqual(exp.maxTotal);
      if (exp.maxPrice != null) {
        for (const p of sample) expect(p.price).toBeLessThanOrEqual(exp.maxPrice);
      }
      if (exp.beds != null) {
        const mismatch = sample.filter(
          (p) => p.bedrooms != null && p.bedrooms !== exp.beds
        );
        expect(mismatch.length).toBeLessThanOrEqual(sample.length * 0.5);
      }
    });
  }
});
