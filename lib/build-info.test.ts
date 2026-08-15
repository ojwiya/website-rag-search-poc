import { describe, it, expect } from 'vitest';
import { getBuildLabel, buildLabelFromEnv } from './build-info';

describe('getBuildLabel', () => {
  it('joins semver and a short SHA for deploys', () => {
    expect(
      getBuildLabel({ version: '0.1.0', sha: '8d4339f6ee6dc09ad00e32101cfe955692e199a1' })
    ).toBe('v0.1.0 · 8d4339f');
  });

  it('falls back to package version when SHA is missing (local dev)', () => {
    expect(getBuildLabel({ version: '0.1.0', sha: '' })).toBe('v0.1.0');
    expect(getBuildLabel({ version: '0.1.0' })).toBe('v0.1.0');
  });

  it('strips a leading v from version', () => {
    expect(getBuildLabel({ version: 'v0.1.0', sha: 'abc1234deadbeef' })).toBe('v0.1.0 · abc1234');
  });

  it('defaults to package.json version', () => {
    expect(getBuildLabel()).toBe('v0.1.0');
  });
});

describe('buildLabelFromEnv', () => {
  it('prefers NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA then VERCEL_GIT_COMMIT_SHA', () => {
    expect(
      buildLabelFromEnv({ NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: 'deadbeefcafebabe' })
    ).toBe('v0.1.0 · deadbee');
    expect(
      buildLabelFromEnv({ VERCEL_GIT_COMMIT_SHA: '8d4339f6ee6dc09a' })
    ).toBe('v0.1.0 · 8d4339f');
  });
});
