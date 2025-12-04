# Local Webhook Testing

This document explains how to test Resend webhook handling locally without deploying or using tunnels.

## Quick Start

```bash
# 1. Seed local D1 with test inquiry
npx wrangler d1 execute inkpup-db-dev --local --file=scripts/db/seed-test-inquiry.sql

# 2. Start dev server (separate terminal)
npm run dev

# 3. Send mock webhook
./scripts/test-webhook-local.sh
```

## How It Works

**Problem:** Resend webhooks can't reach `localhost` directly. Deploying for every test iteration is too slow.

**Solution:** Mock webhook payloads for rapid local iteration.

### Workflow

1. **Mock Payload** → Real Resend webhook event structure in `tests/fixtures/resend-webhook-email-received.json`
2. **Test Script** → `scripts/test-webhook-local.sh` POSTs to `http://localhost:3002/api/webhooks/resend`
3. **Dev Bypass** → Webhook route allows unsigned requests when `NODE_ENV=development`
4. **Instant Feedback** → <10 second iteration cycles, VS Code debugger works

### Files

| File | Purpose |
|------|---------|
| `tests/fixtures/resend-webhook-email-received.json` | Mock Resend `email.received` event payload |
| `scripts/test-webhook-local.sh` | curl script to POST mock event to localhost |
| `scripts/db/seed-test-inquiry.sql` | Creates test inquiry matching mock sender email |
| `app/api/webhooks/resend/route.ts` | Webhook handler (bypasses signature in dev) |

## Usage

### Daily Development

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Run test
./scripts/test-webhook-local.sh

# Expected output:
# ✅ Webhook test successful!
# Check logs and D1 for inbound email record
```

### Debugging

Use VS Code debugger:

1. Set breakpoint in `app/api/webhooks/resend/route.ts`
2. Press F5 (attach to Next.js)
3. Run `./scripts/test-webhook-local.sh`
4. Breakpoint hits → inspect variables

### Customizing Test Data

Edit `tests/fixtures/resend-webhook-email-received.json`:

```json
{
  "type": "email.received",
  "data": {
    "from": "customer@example.com",  // Change sender
    "subject": "Custom test subject", // Change subject
    ...
  }
}
```

**Important:** If you change the sender email, create a matching inquiry in D1:

```sql
INSERT INTO inquiries (name, email, status) 
VALUES ('Test User', 'customer@example.com', 'replied');
```

## Pre-Deploy Validation (Optional)

Before deploying webhook changes, validate with real Resend:

```bash
# 1. Start tunnel
cloudflared tunnel --url http://localhost:3002

# 2. Temporarily update Resend webhook URL
# Go to https://resend.com/webhooks
# Change URL to: https://xyz.trycloudflare.com/api/webhooks/resend

# 3. Send real test email → customer reply

# 4. Verify webhook receives real event

# 5. Restore Resend webhook URL
# Change back to: https://dev.admin.inkpup.ca/api/webhooks/resend
```

## Security

**Dev bypass is safe:**
- Only active when `NODE_ENV=development`
- Never set `NODE_ENV=development` in production
- Production always verifies Svix signatures

**Verification:**
```typescript
if (process.env.NODE_ENV === 'development') {
  // Allow unsigned for local testing
} else {
  // Svix signature verification (production)
}
```

## Troubleshooting

### Webhook returns 500 "Database unavailable"
- Start dev server with Cloudflare bindings: `npm run dev` (not `next dev`)
- Verify D1 binding in `wrangler.toml`

### "No matching inquiry" error
- Seed test inquiry: `npx wrangler d1 execute inkpup-db-dev --local --file=scripts/db/seed-test-inquiry.sql`
- Or update fixture email to match existing inquiry

### Test script fails with "command not found: jq"
- Install jq: `brew install jq` (macOS) or `apt install jq` (Linux)
- Or remove `| jq '.'` from script (less pretty output)

### Breakpoints don't hit
- Ensure VS Code debugger is attached (F5)
- Check `.vscode/launch.json` has Next.js config
- Verify dev server is running

## Realtime Updates (WebSocket Notifications)

When a webhook is processed successfully, the webhook handler notifies the realtime worker to push updates to connected admin clients.

### How It Works

```
Webhook POST → D1 Insert → Service Binding → Realtime DO → WebSocket Broadcast → UI Refresh
```

1. **Webhook receives email**: `POST /api/webhooks/resend`
2. **Handler stores email**: Inserts into `inquiry_messages` table
3. **Handler notifies realtime**: Calls `notifyInquiryUpdate()` via service binding
4. **Realtime worker broadcasts**: `POST /realtime/notify/:inquiryId` → DO broadcasts to all connected WebSockets
5. **Admin UI receives message**: `useInquiryWebSocket` hook receives `email_received` event
6. **UI auto-refreshes**: Conversation updates without polling or page reload

### Local Testing with Realtime

For full realtime testing locally, you need both workers running:

```bash
# Terminal 1: Start realtime worker
cd workers/realtime
npx wrangler dev --env dev --local

# Terminal 2: Start main app
npm run dev

# Terminal 3: Open admin UI and view an inquiry
# Terminal 4: Send mock webhook
./scripts/test-webhook-local.sh
```

**Note:** Without the realtime worker running locally, the service binding won't connect. This is expected behavior - the main app continues to work, but realtime updates won't be pushed. The client hook handles this gracefully with reconnection logic.

### Verifying Realtime Notifications

When testing, check for:

1. **Webhook response** includes `"notified": true`:
   ```json
   {"success": true, "emailId": "...", "notified": true}
   ```

2. **Realtime health** shows connection:
   ```bash
   curl http://localhost:8787/realtime/health
   # {"ok":true,"connections":1,"timestamp":"..."}
   ```

3. **Browser console** shows WebSocket message:
   ```
   [useInquiryWebSocket] Received: {"type":"email_received","inquiryId":"..."}
   ```

### Troubleshooting Realtime

#### Webhook succeeds but `notified: false`
- Realtime worker not running or service binding not configured
- Check `REALTIME` binding in `wrangler.toml`
- Verify realtime worker is deployed (or running locally)

#### WebSocket connects then immediately closes
- Check authentication - admin session must be valid
- Verify WebSocket upgrade endpoint: `/realtime/inquiry/:id/ws`
- Check browser console for CORS or auth errors

#### No message received after webhook
- Confirm inquiry ID matches between webhook and WebSocket connection
- Check realtime worker logs for notify handling
- Verify DO instance is receiving broadcast request

## References

- [Think.prompt.md Research Brief](../AI-Memory/activeContext.md) - Full research and decision rationale
- [Resend Webhook Docs](https://resend.com/docs/dashboard/webhooks/introduction)
- [Local Development Pattern](../AI-Memory/systemPatterns.md#local-webhook-testing-pattern)
- [Realtime Worker README](../workers/realtime/README.md) - Detailed realtime architecture
