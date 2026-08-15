# Job: site reliability

1. Run `scripts/agent/site_healthcheck.sh` against configured BASE_URL.
2. On failure: Telegram alert with status codes.
3. After deploys: Playwright smoke when UI/search changed.
