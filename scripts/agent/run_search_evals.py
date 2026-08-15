#!/usr/bin/env python3
"""Run golden NL queries against a running Next server (or BASE_URL)."""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GOLDEN = ROOT / "docs" / "agent-ops" / "golden-queries.json"
BASE = os.environ.get("BASE_URL", "http://127.0.0.1:3000").rstrip("/")


def fetch(path: str) -> dict:
    url = f"{BASE}{path}"
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.loads(r.read().decode())


def main() -> int:
    spec = json.loads(GOLDEN.read_text())
    failed = 0
    for q in spec["queries"]:
        qs = urllib.parse.urlencode({"q": q["q"], "limit": "50"})
        data = fetch(f"/api/properties?{qs}")
        total = data.get("total", 0)
        props = data.get("properties") or []
        exp = q.get("expect") or {}
        ok = True
        reasons = []
        if "minTotal" in exp and total < exp["minTotal"]:
            ok = False
            reasons.append(f"total {total} < min {exp['minTotal']}")
        if "maxTotal" in exp and total > exp["maxTotal"]:
            ok = False
            reasons.append(f"total {total} > max {exp['maxTotal']}")
        if "maxPrice" in exp and props:
            bad = [p for p in props if p.get("price", 0) > exp["maxPrice"]]
            if bad:
                ok = False
                reasons.append(f"{len(bad)} results over maxPrice")
        if "beds" in exp and props:
            # beds filter is on search parse; sample first page
            mismatch = [
                p
                for p in props
                if p.get("bedrooms") is not None and p.get("bedrooms") != exp["beds"]
            ]
            if len(mismatch) > len(props) * 0.5:
                ok = False
                reasons.append(f"many beds mismatches vs {exp['beds']}")
        status = "PASS" if ok else "FAIL"
        print(f"{status} {q['id']}: total={total} q={q['q']!r} {'; '.join(reasons)}")
        if not ok:
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
