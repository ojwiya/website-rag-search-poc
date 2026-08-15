import pkg from '../package.json';

export function getBuildLabel(opts?: { version?: string; sha?: string | null }): string {
  const version = (opts?.version ?? pkg.version).replace(/^v/, '');
  const sha = (opts?.sha || '').trim().slice(0, 7);
  if (sha) return `v${version} · ${sha}`;
  return `v${version}`;
}

export function buildLabelFromEnv(
  env: Record<string, string | undefined> = process.env
): string {
  return getBuildLabel({
    sha:
      env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
      env.VERCEL_GIT_COMMIT_SHA ||
      null,
  });
}
