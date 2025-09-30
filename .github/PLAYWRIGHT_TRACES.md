Playwright traces

This project runs Playwright end-to-end tests in CI and retains traces only for failing tests.

Where traces appear
- CI: When a Playwright test fails, a per-run `trace.zip` is generated under `test-results/` (for the browser and test run that failed). The Actions workflow uploads `test-results/**/trace.zip` as an artifact named `playwright-traces-<browser>`.

How traces are produced
- Tests are run with `--trace=retain-on-failure`. Playwright will only save traces for runs that fail.

Finding traces in GitHub Actions
1. Open the workflow run that has failing Playwright tests.
2. Select the job for the browser you want to inspect (e.g. `chromium`).
3. In the run summary, open the Artifacts section and download the `playwright-traces-<browser>` artifact.
4. Unzip `trace.zip` and open it in the Playwright Trace Viewer:
   - Locally: `npx playwright show-trace trace.zip`

Notes
- The workflow first checks whether any trace files exist before uploading to avoid no-op uploads.
- Traces are only saved for failing tests when `--trace=retain-on-failure` is used; for full tracing on all runs use `--trace=on` (not recommended in CI due to size).

Environment
- You can set `PORT` and `PLAYWRIGHT_BASE_URL` in a local `.env` file (an example is provided in `.env.example`). The CI workflow uses the `PLAYWRIGHT_BASE_URL` environment variable when starting the server.
