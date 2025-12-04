# Realtime Worker (Durable Objects)

Provides WebSocket-based real-time updates for Inquiry conversations using Cloudflare Durable Objects with hibernatable WebSockets.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Main App      │     │ Realtime Worker │     │  Admin Browser  │
│  (Next.js)      │────▶│  (Durable Obj)  │◀────│  (WebSocket)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │ POST /notify/:id      │ WebSocket messages
        └───────────────────────┘
```

### Flow

1. **Admin opens inquiry**: Browser connects to `wss://admin.inkpup.ca/realtime/inquiry/:id/ws`
2. **Customer replies**: Resend webhook → Main app → D1 insert → Service binding call to `/notify/:id`
3. **DO broadcasts**: All connected WebSockets for that inquiry receive `{ type: 'email_received', ... }`
4. **UI updates**: Client hook receives message, refreshes conversation without polling

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/realtime/inquiry/:id/ws` | Upgrade to WebSocket, routed to DO instance |
| `POST` | `/realtime/notify/:id` | Broadcast message to all connected clients |
| `GET` | `/realtime/health` | Health status with connection count |

## Durable Object

`InquiryUpdatesDO` leverages Cloudflare's hibernatable WebSockets API to manage long-lived connections efficiently. Messages supported:

| Type | Trigger | Action |
|------|---------|--------|
| `email_received` | Inbound email webhook | Refresh conversation |
| `email_sent` | Outbound email sent | Refresh conversation |
| `status_changed` | Inquiry status update | Refresh UI state |
| `connected` | WebSocket opened | Confirmation |
| `ping/pong` | Heartbeat | Keep-alive |

## Configuration

Service binding in main `wrangler.toml`:

```toml
[[env.production.services]]
binding = "REALTIME"
service = "inkpup-realtime"
```

Durable Object config in `workers/realtime/wrangler.toml`:

```toml
[[env.production.durable_objects.bindings]]
name = "INQUIRY_UPDATES"
class_name = "InquiryUpdatesDO"
```

## Deployment

**CI Pipeline (recommended):** Deployed automatically via `.github/workflows/cloudflare-reusable.yml` before the main app.

**Manual (development only):**

```bash
cd workers/realtime
npx wrangler deploy --env dev
```

Two environments defined:

- `inkpup-realtime-dev` (dev): `dev.admin.inkpup.ca/realtime/*`
- `inkpup-realtime` (prod): `admin.inkpup.ca/realtime/*`

> ⚠️ **Note:** Deploy via CI pipeline for production. Manual deploys should only be used for local development testing.

## Health Checks

```bash
# Check worker health
curl https://admin.inkpup.ca/realtime/health

# Expected response:
{"ok":true,"connections":0,"timestamp":"2025-12-03T..."}
```

## Testing

### Unit Tests

```bash
npm test -- -t useInquiryWebSocket  # Hook tests
npm test -- -t InquiryDetail        # Component integration
```

### E2E Tests

```bash
ADMIN_E2E=true npm run test:e2e -- --grep "Realtime"
```

### Manual Testing

1. Open inquiry detail in admin UI
2. Trigger mock webhook: `./scripts/test-webhook-local.sh`
3. Conversation should update without page refresh

## Troubleshooting

### WebSocket connection fails

- Verify worker is deployed: `curl https://admin.inkpup.ca/realtime/health`
- Check browser console for connection errors
- Ensure route pattern matches: `/realtime/inquiry/:id/ws`

### Notify doesn't broadcast

- Verify service binding in main `wrangler.toml`
- Check main app logs for notify errors
- Verify inquiry ID matches between webhook and DO instance

### Stale connections

Hibernatable WebSockets automatically clean up. If issues persist:
- Check `ctx.getWebSockets()` count in health endpoint
- DO instances are isolated per inquiry ID (`idFromName`)

## Security

- WebSocket endpoint requires admin authentication (via session cookie)
- Notify endpoint is internal only (service binding, not public)
- All connections use WSS (TLS)
