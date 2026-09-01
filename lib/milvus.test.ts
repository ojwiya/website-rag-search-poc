import { describe, it, expect, afterEach } from 'vitest';
import {
  searchListings,
  getMilvusPort,
  createRestMilvusPort,
  type MilvusPort,
} from './milvus';
import { searchProperties, type Property } from './rag';

function prop(
  p: Partial<Property> & Pick<Property, 'id' | 'title' | 'country_slug' | 'locationName' | 'price' | 'eurPrice'>
): Property {
  return {
    currencyCode: 'EUR',
    gbpPrice: p.eurPrice,
    bedrooms: null,
    bathrooms: null,
    plotSize: null,
    buildSize: null,
    latitude: 0,
    longitude: 0,
    description: '',
    url: '',
    image_count: 0,
    thumbnail_url: null,
    ...p,
  };
}

const fixtures: Property[] = [
  prop({ id: 7, title: 'Apartment in Lisbon', country_slug: 'portugal', locationName: 'Lisbon', price: 38000, eurPrice: 38000, description: 'affordable apartment with balcony', bedrooms: 2 }),
  prop({ id: 8, title: 'Apartment in Porto', country_slug: 'portugal', locationName: 'Porto', price: 1500000, eurPrice: 1500000, description: 'luxury apartment with sea view', bedrooms: 2 }),
  prop({ id: 9, title: 'House in Republic of Malta', country_slug: 'malta', locationName: 'Republic of Malta', price: 20000, eurPrice: 20000, description: 'budget house, no pool', bedrooms: 2 }),
];

describe('searchListings', () => {
  it('falls back to local searchProperties when port is null', async () => {
    const local = searchProperties(fixtures, 'apartment less than €300,000', 20);
    const via = await searchListings(fixtures, 'apartment less than €300,000', 20, null);
    expect(via.map((p) => p.id)).toEqual(local.map((p) => p.id));
  });

  it('hydrates Milvus hits and keeps AND-gate (apartments only)', async () => {
    const port: MilvusPort = {
      queryIds: async () => [7, 8, 9],
      search: async () => [
        { id: 9, score: 0.99 },
        { id: 7, score: 0.5 },
        { id: 8, score: 0.1 },
      ],
    };
    const r = await searchListings(fixtures, 'apartment less than €300,000', 20, port);
    expect(r.map((p) => p.id)).toEqual([7]);
    expect(r[0].price).toBeLessThanOrEqual(300000);
  });

  it('orders surviving hits by Milvus score', async () => {
    const port: MilvusPort = {
      queryIds: async () => [7, 9],
      search: async () => [
        { id: 9, score: 0.2 },
        { id: 7, score: 0.9 },
      ],
    };
    const r = await searchListings(fixtures, 'apartment less than €300,000', 20, port);
    expect(r.map((p) => p.id)).toEqual([7]);
  });

  it('orders multiple AND-gate survivors by Milvus score', async () => {
    const port: MilvusPort = {
      queryIds: async () => [7, 8],
      search: async () => [
        { id: 8, score: 0.2 },
        { id: 7, score: 0.9 },
      ],
    };
    const r = await searchListings(fixtures, 'apartment', 20, port);
    expect(r.map((p) => p.id)).toEqual([7, 8]);
  });

  it('hydrates scalar-only country queries from queryIds, not BM25 search', async () => {
    const port: MilvusPort = {
      queryIds: async () => [4, 10, 1],
      search: async () => [{ id: 9, score: 1 }],
    };
    const r = await searchListings(
      [
        prop({
          id: 4,
          title: 'Villa in Valencia',
          country_slug: 'spain',
          locationName: 'Valencia',
          price: 425000,
          eurPrice: 425000,
        }),
        prop({
          id: 10,
          title: 'House in Murcia',
          country_slug: 'spain',
          locationName: 'Murcia',
          price: 200000,
          eurPrice: 200000,
        }),
        prop({
          id: 1,
          title: 'House in France',
          country_slug: 'france',
          locationName: 'Ansac',
          price: 136250,
          eurPrice: 136250,
        }),
        prop({
          id: 9,
          title: 'House in Republic of Malta',
          country_slug: 'malta',
          locationName: 'Malta',
          price: 20000,
          eurPrice: 20000,
        }),
      ],
      'spain',
      20,
      port
    );
    // queryIds returns 4, 10, 1 — local country filter drops France (1).
    // If we wrongly used search(), only Malta (9) would hydrate and then be dropped.
    expect(r.map((p) => p.id)).toEqual([4, 10]);
    for (const p of r) expect(p.country_slug).toBe('spain');
  });

  it('falls back to local searchProperties when the port throws', async () => {
    const port: MilvusPort = {
      queryIds: async () => {
        throw new Error('zilliz down');
      },
      search: async () => {
        throw new Error('zilliz down');
      },
    };
    const local = searchProperties(fixtures, 'apartment less than €300,000', 20);
    const via = await searchListings(fixtures, 'apartment less than €300,000', 20, port);
    expect(via.map((p) => p.id)).toEqual(local.map((p) => p.id));
  });
});

describe('getMilvusPort', () => {
  const prevToken = process.env.ZILLIZ_TOKEN;
  const prevUri = process.env.ZILLIZ_URI;

  afterEach(() => {
    if (prevToken === undefined) delete process.env.ZILLIZ_TOKEN;
    else process.env.ZILLIZ_TOKEN = prevToken;
    if (prevUri === undefined) delete process.env.ZILLIZ_URI;
    else process.env.ZILLIZ_URI = prevUri;
  });

  it('returns null when ZILLIZ_TOKEN is unset so CI stays offline', () => {
    delete process.env.ZILLIZ_TOKEN;
    expect(getMilvusPort()).toBeNull();
  });
});

describe('createRestMilvusPort', () => {
  it('posts residual text and filter expr to the Zilliz search endpoint', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const fetchFn: typeof fetch = async (url, init) => {
      calls.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
      });
      return new Response(
        JSON.stringify({ code: 0, data: [{ id: 7, distance: 0.4 }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };
    const port = createRestMilvusPort({
      uri: 'https://example.zilliz.com',
      token: 'tok',
      collection: 'listings',
      fetch: fetchFn,
    });
    const hits = await port.search({
      expr: 'price <= 300000',
      text: 'apartment',
      limit: 20,
    });
    expect(hits).toEqual([{ id: 7, score: 0.4 }]);
    expect(calls[0].url).toBe('https://example.zilliz.com/v2/vectordb/entities/search');
    expect(calls[0].body).toMatchObject({
      collectionName: 'listings',
      data: ['apartment'],
      filter: 'price <= 300000',
      annsField: 'sparse',
      limit: 20,
    });
    expect(String(calls[0].body)).not.toContain('tok');
  });

  it('queries ids with id >= 0 when the expr is empty', async () => {
    const fetchFn: typeof fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body.filter).toBe('id >= 0');
      return new Response(JSON.stringify({ code: 0, data: [{ id: 4 }, { id: 10 }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const port = createRestMilvusPort({
      uri: 'https://example.zilliz.com',
      token: 'tok',
      fetch: fetchFn,
    });
    await expect(port.queryIds({ expr: '', limit: 50 })).resolves.toEqual([4, 10]);
  });
});
