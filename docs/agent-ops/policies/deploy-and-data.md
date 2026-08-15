# Policy: deploy & data

- Prod deploys that change search behaviour or index shape: **draft-first** (Bob approves).
- Replacing `rag/properties_data.json` or enabling M1 ingest: draft-first PR + approval.
- After deploy: run Playwright smoke and `scripts/agent/site_healthcheck.sh` against prod URL.
