/** Zilliz/Milvus search port — BM25 at query time (no embedding model on Vercel). */

import {
  filterProperties,
  getSearchPlan,
  intentToMilvusExpr,
  listingMatchesTerms,
  searchProperties,
  type Property,
} from './rag';

export const DEFAULT_ZILLIZ_URI =
  'https://in03-c1d6d9a951a5528.serverless.aws-eu-central-1.cloud.zilliz.com';
export const DEFAULT_ZILLIZ_COLLECTION = 'listings';

const MILVUS_CAP = 16384;

export type MilvusHit = { id: number; score: number };

export type MilvusSearchArgs = {
  expr?: string;
  text?: string;
  limit?: number;
};

export type MilvusPort = {
  queryIds: (args?: MilvusSearchArgs) => Promise<number[]>;
  search: (args?: MilvusSearchArgs) => Promise<MilvusHit[]>;
};

export type RestMilvusOptions = {
  uri: string;
  token: string;
  collection?: string;
  fetch?: typeof fetch;
};

function capLimit(limit?: number): number {
  const n = limit ?? 20;
  return Math.min(Math.max(n, 1), MILVUS_CAP);
}

function joinUrl(uri: string, path: string): string {
  return `${uri.replace(/\/$/, '')}${path}`;
}

function asRows(data: unknown): Record<string, unknown>[] {
  let rows: unknown = data;
  if (Array.isArray(rows) && rows.length === 1 && Array.isArray(rows[0])) {
    rows = rows[0];
  }
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row && typeof row === 'object') as Record<
    string,
    unknown
  >[];
}

function asHits(data: unknown): MilvusHit[] {
  return asRows(data)
    .map((row) => ({
      id: Number(row.id ?? row.pk),
      score: Number(row.distance ?? row.score ?? 0),
    }))
    .filter((h) => Number.isFinite(h.id));
}

function asIds(data: unknown): number[] {
  return asRows(data)
    .map((row) => Number(row.id ?? row.pk))
    .filter((id) => Number.isFinite(id));
}

async function zillizPost(
  opts: RestMilvusOptions,
  path: string,
  body: Record<string, unknown>
): Promise<{ data: unknown }> {
  const fetchFn = opts.fetch ?? fetch;
  const res = await fetchFn(joinUrl(opts.uri, path), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    code?: number;
    message?: string;
    data?: unknown;
  };
  const code = json.code;
  if (!res.ok || (code != null && code !== 0 && code !== 200)) {
    throw new Error(json.message || `Zilliz ${path} failed: ${res.status}`);
  }
  return json;
}

export function createRestMilvusPort(opts: RestMilvusOptions): MilvusPort {
  const collection = opts.collection || DEFAULT_ZILLIZ_COLLECTION;
  return {
    async queryIds(args) {
      const json = await zillizPost(opts, '/v2/vectordb/entities/query', {
        collectionName: collection,
        filter: args?.expr?.trim() ? args.expr : 'id >= 0',
        limit: capLimit(args?.limit),
        outputFields: ['id'],
      });
      return asIds(json.data);
    },
    async search(args) {
      const body: Record<string, unknown> = {
        collectionName: collection,
        data: [args?.text || ''],
        annsField: 'sparse',
        limit: capLimit(args?.limit),
        outputFields: ['id'],
      };
      if (args?.expr?.trim()) body.filter = args.expr;
      const json = await zillizPost(opts, '/v2/vectordb/entities/search', body);
      return asHits(json.data);
    },
  };
}

export function getMilvusPort(): MilvusPort | null {
  const token = process.env.ZILLIZ_TOKEN?.trim();
  if (!token) return null;
  return createRestMilvusPort({
    uri: (process.env.ZILLIZ_URI || DEFAULT_ZILLIZ_URI).replace(/\/$/, ''),
    token,
    collection: process.env.ZILLIZ_COLLECTION || DEFAULT_ZILLIZ_COLLECTION,
  });
}

export async function searchListings(
  properties: Property[],
  query: string,
  limit = 20,
  port: MilvusPort | null
): Promise<Property[]> {
  if (!port) return searchProperties(properties, query, limit);

  const { intent, filters, embedTerms, scoringTerms } = getSearchPlan(query);
  const expr = intentToMilvusExpr(intent);
  const fetchLimit = capLimit(Math.max(limit * 5, limit, 50));

  let hits: MilvusHit[];
  try {
    if (embedTerms.length > 0) {
      hits = await port.search({
        expr,
        text: embedTerms.join(' '),
        limit: fetchLimit,
      });
    } else {
      const ids = await port.queryIds({ expr, limit: fetchLimit });
      hits = ids.map((id, i) => ({ id, score: ids.length - i }));
    }
  } catch {
    return searchProperties(properties, query, limit);
  }

  const byId = new Map(properties.map((p) => [p.id, p]));
  const hydrated: Array<{ property: Property; score: number }> = [];
  for (const hit of hits) {
    const p = byId.get(hit.id);
    if (!p) continue;
    if (!listingMatchesTerms(p, scoringTerms)) continue;
    hydrated.push({ property: p, score: hit.score });
  }

  const allowed = new Set(
    filterProperties(
      hydrated.map((h) => h.property),
      filters
    ).map((p) => p.id)
  );
  const surviving = hydrated.filter((h) => allowed.has(h.property.id));

  if (embedTerms.length === 0) {
    for (const row of surviving) {
      if (filters.maxPrice !== undefined) {
        row.score += (filters.maxPrice - row.property.price) / 1000;
      }
      if (filters.minPrice !== undefined) {
        row.score += (row.property.price - filters.minPrice) / 1000;
      }
    }
  }

  surviving.sort((a, b) => b.score - a.score);
  return surviving.slice(0, limit).map((s) => s.property);
}

