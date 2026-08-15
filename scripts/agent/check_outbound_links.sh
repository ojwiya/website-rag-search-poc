#!/usr/bin/env bash
# Sample absolute canonical URLs from the M0 snapshot and HEAD-check a few.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DATA="$ROOT/rag/properties_data.json"
ORIGIN="${YOH_ORIGIN:-https://www.youroverseashome.com}"
SAMPLE="${SAMPLE:-8}"

if [[ ! -f "$DATA" ]]; then
  echo "Missing $DATA"
  exit 1
fi

python3 - <<PY
import json, urllib.request, ssl
from pathlib import Path
data = json.loads(Path("$DATA").read_text())
props = data["properties"] if isinstance(data, dict) else data
origin = "$ORIGIN".rstrip("/")
n = int("$SAMPLE")
fail = 0
ctx = ssl.create_default_context()
for p in props[:n]:
    url = p.get("url") or ""
    if url.startswith("/"):
        url = origin + url
    elif not url.startswith("http"):
        print("SKIP bad url", p.get("id"))
        continue
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "homes-in-the-sun-linkcheck/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
            code = r.status
    except Exception as e:
        # Some hosts block HEAD — try GET range
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "homes-in-the-sun-linkcheck/1.0"})
            with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
                code = r.status
        except Exception as e2:
            print("FAIL", p.get("id"), url, e2)
            fail += 1
            continue
    status = "OK" if 200 <= code < 400 else "FAIL"
    print(status, code, p.get("id"), url[:80])
    if status == "FAIL":
        fail += 1
raise SystemExit(1 if fail else 0)
PY
