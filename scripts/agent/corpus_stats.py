#!/usr/bin/env python3
"""Report M0 corpus stats for index governance job."""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "rag" / "properties_data.json"


def main() -> None:
    st = DATA.stat()
    data = json.loads(DATA.read_text())
    props = data["properties"] if isinstance(data, dict) else data
    countries = Counter(p.get("country_slug") for p in props)
    print(f"file={DATA}")
    print(f"mtime_utc={datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat()}")
    print(f"count={len(props)}")
    print("countries=")
    for k, v in countries.most_common():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
