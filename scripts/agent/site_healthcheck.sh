#!/usr/bin/env bash
# Smoke homepage + search + properties + country guides.
# Default: local. For prod: BASE_URL=https://website-rag-search-poc.vercel.app ./site_healthcheck.sh
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
fail=0

check() {
  local path="$1"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 30 "$BASE_URL$path" || echo "000")
  if [[ "$code" =~ ^2 ]]; then
    echo "OK  $code  $path"
  else
    echo "FAIL $code  $path"
    fail=1
  fi
}

echo "Healthcheck BASE_URL=$BASE_URL"
check "/"
check "/api/search?q=villa"
check "/api/properties?limit=1"
check "/api/guides/spain"
check "/guides/spain"
check "/api/guides/portugal"
check "/guides/portugal"

exit "$fail"
