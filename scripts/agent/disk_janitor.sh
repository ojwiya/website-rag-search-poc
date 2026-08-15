#!/usr/bin/env bash
# Light cleanup for local agent machine — Next caches / old Playwright artifacts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
rm -rf test-results playwright-report .last-run.json 2>/dev/null || true
# Do NOT rm -rf .next (HANDOFF: can cause confusing local errors mid-session)
echo "Janitor: cleared Playwright artifacts under $ROOT"
df -h . | tail -1
