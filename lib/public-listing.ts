import type { Property } from './rag';
import { getPropertyById } from './rag';
import { propertyToCanonical } from './sources/yoh-snapshot';

/** Public API/UI row: snippet only, absolute canonical URL — not the fat listing body. */
export function toPublicProperty(p: Property): Property {
  const c = propertyToCanonical(p);
  return {
    ...p,
    url: c.canonical_url,
    description: c.snippet || '',
    hasPool: Boolean(c.extras?.hasPool),
  };
}

export function toPublicProperties(list: Property[]): Property[] {
  return list.map(toPublicProperty);
}

export function getPublicPropertyById(id: number): Property | undefined {
  const p = getPropertyById(id);
  return p ? toPublicProperty(p) : undefined;
}
