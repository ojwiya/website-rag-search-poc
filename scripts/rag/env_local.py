"""Load repo-root `.env.local` into process env for local Python scripts.

Does not override keys already set in the environment (shell wins).
Never prints secret values.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV_LOCAL = ROOT / ".env.local"


def load_env_file(path: Path, environ: dict[str, str] | None = None) -> dict[str, str]:
    """Parse KEY=VALUE lines into `environ`. Skip comments, blanks, and existing keys."""
    import os

    target: dict[str, str] = environ if environ is not None else os.environ  # type: ignore[assignment]
    applied: dict[str, str] = {}
    if not path.is_file():
        return applied
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if not key:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        if key in target and str(target[key]).strip() != "":
            continue
        target[key] = value
        applied[key] = value
    return applied


def load_env_local() -> Path | None:
    """Load `.env.local` from the repo root into os.environ. Returns the path if it existed."""
    if not ENV_LOCAL.is_file():
        return None
    load_env_file(ENV_LOCAL)
    return ENV_LOCAL
