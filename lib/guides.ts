import fs from 'fs';
import path from 'path';

export interface GuideSource {
  label: string;
  url: string;
}

export interface GuideSection {
  id: string;
  title: string;
  body: string;
}

export interface CountryGuide {
  country: string;
  title: string;
  updated_at: string;
  sections: GuideSection[];
  sources: GuideSource[];
  disclaimer: string;
}

const DEFAULT_DISCLAIMER =
  'Educational overview only — not legal, tax, or financial advice. Verify with qualified professionals in the country of purchase before acting.';

let cache: Map<string, CountryGuide> | null = null;

function guidesDir(): string {
  return path.join(process.cwd(), 'content', 'country-guides');
}

export function listGuideCountries(): string[] {
  try {
    return fs
      .readdirSync(guidesDir())
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

export function getCountryGuide(country: string): CountryGuide | null {
  const slug = country.toLowerCase().trim();
  if (!slug) return null;

  if (!cache) cache = new Map();
  if (cache.has(slug)) return cache.get(slug)!;

  const file = path.join(guidesDir(), `${slug}.json`);
  if (!fs.existsSync(file)) return null;

  const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as CountryGuide;
  const guide: CountryGuide = {
    ...raw,
    country: raw.country || slug,
    disclaimer: raw.disclaimer || DEFAULT_DISCLAIMER,
    sources: raw.sources || [],
    sections: raw.sections || [],
  };
  cache.set(slug, guide);
  return guide;
}
