# Playwright E2E Testing

## How to run Playwright tests

1. Start your Next.js app:
   ```bash
   npm run dev
   # or
   npm run build && npm start
   ```

2. In a separate terminal, run Playwright tests:
   ```bash
   npx playwright test
   ```

## View HTML reports
After running tests:
```bash
npx playwright show-report
```

## Test location
All Playwright tests are in `tests/e2e/`.

## Example test
See `tests/e2e/homepage.spec.ts` for a sample homepage test.
