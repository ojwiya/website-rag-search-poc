/** Default origin for legacy relative listing paths in the M0 YOH snapshot. */
export const YOH_ORIGIN = 'https://www.youroverseashome.com';

/**
 * Resolve a listing URL to an absolute canonical URL.
 * Relative paths (legacy snapshot) are prefixed with YOH_ORIGIN.
 */
export function toAbsoluteCanonicalUrl(
  url: string | undefined | null,
  origin: string = YOH_ORIGIN
): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) {
    return `${origin.replace(/\/$/, '')}${trimmed}`;
  }
  return `${origin.replace(/\/$/, '')}/${trimmed}`;
}

export function buildRedirectPath(opts: {
  url: string;
  listingId?: string | number;
  source?: string;
}): string {
  const params = new URLSearchParams({ url: opts.url });
  if (opts.listingId != null) params.set('listingId', String(opts.listingId));
  if (opts.source) params.set('source', opts.source);
  return `/api/redirect?${params.toString()}`;
}

export function validateRedirectTarget(
  url: string
): { ok: true; href: string } | { ok: false; error: string } {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, error: 'Only http(s) redirects allowed' };
    }
    return { ok: true, href: parsed.toString() };
  } catch {
    return { ok: false, error: 'Invalid url' };
  }
}
