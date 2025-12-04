# Plan: Durable Objects Real-Time Email Updates

[CONTEXT:2025-12-03]

This plan follows the structure in `.github/prompts/Plan.prompt.md` and is saved to AI-Memory (read-only prompts are not modified).

---

## 1. Define the Main Task

**Task:**
Implement real-time UI updates for Inquiry conversations using Cloudflare Durable Objects and WebSockets, with a separate realtime worker and no polling.

---

## 2. Break Down the Task

**Major Components or Steps:**
- Create separate realtime worker (Cloudflare Worker) for WebSockets
- Configure wrangler.toml for Durable Object bindings and routes
- Implement WebSocket upgrade endpoint and DO class
- Implement notify endpoint for webhook → DO broadcast
- Create UI WebSocket hook (client)
- Update webhook to notify realtime worker
- Connect `InquiryDetail` to WebSocket updates
- Unit and E2E tests
- Deploy via pipeline (no direct wrangler deploy)

---

## 3. Outline Actionable Steps for Each Component

### Step A: Realtime Worker Setup
- Create new worker project (e.g., `workers/realtime`)
- Add entry points:
  - `GET /inquiry/:id/ws` → WebSocket upgrade, route to DO instance via `idFromName(id)`
  - `POST /notify/:id` → Accept JSON message and broadcast via DO
- Implement `InquiryUpdatesDO` using hibernatable WebSockets API:
  - `fetch()` routes requests to upgrade/notify/health
  - `webSocketMessage()` handles ping/pong and client messages
  - Broadcast helper sends to all active sockets

### Step B: Wrangler Configuration
- New `wrangler.toml` for realtime worker with:
  - `[[durable_objects.bindings]]` name = `INQUIRY_UPDATES`, class_name = `InquiryUpdatesDO`
  - `[[migrations]]` tags and `new_classes` entries
  - Dev/Prod routes: `/realtime/*`
- In main app worker, add service binding to realtime worker (e.g., `REALTIME`)

### Step C: WebSocket Client Hook
- `useInquiryWebSocket(inquiryId)`
  - Connect to `/realtime/inquiry/:id/ws`
  - Heartbeat (ping/pong), reconnect with backoff
  - Expose `onMessage` and `send` callbacks
  - No polling

### Step D: Webhook → DO Notification
- In `app/api/webhooks/resend/route.ts` after storing inbound email in D1:
  - Call service binding `env.REALTIME.fetch('/notify/:id', { body: JSON.stringify({ type: 'email_received', ... }) })`

### Step E: UI Integration
- Update `InquiryDetail.tsx` to use `useInquiryWebSocket(inquiry.id)`
  - On `email_received`, append message to conversation state
  - Show subtle toast/banner “New message received”

### Step F: Testing
- Unit tests (Vitest):
  - DO broadcast delivery and error handling
  - Ping/pong logic
  - Hook reconnection behavior and message parsing
  - Webhook notification call mocked
- E2E (Playwright):
  - Open InquiryDetail (admin)
  - Trigger mock webhook
  - Validate UI updates in real time (no refresh, no polling)

### Step G: Deployment (Pipeline)
- CI builds/apply DO migrations for realtime worker
- Deploy realtime worker first (routes `/realtime/*`)
- Deploy main app worker with service binding
- Post-deploy health checks for realtime worker and test notification

---

## 4. Assign #todos

- #todo Create separate realtime worker
- #todo Configure wrangler for DO and routes
- #todo Implement WebSocket upgrade endpoint
- #todo Implement notify endpoint
- #todo Create UI WebSocket hook
- #todo Wire webhook to DO
- #todo Connect InquiryDetail to WebSocket
- #todo Unit tests for DO & hook
- #todo E2E tests for live updates
- #todo Pipeline integration for both workers
- #todo Docs & runbooks

---

## 5. Utilize Tools

- Worker scaffolding: Cloudflare Wrangler
- Durable Object coding: cloudflare:workers APIs
- Main app → realtime: Service binding via wrangler.toml
- Unit testing: Vitest/Jest
- E2E testing: Playwright
- Progress tracking: AI-Memory (updateProgress, updateContext), todo list tool

---

## 6. Save to Memory Management

- Save plan: AI-Memory (this file)
- Update progress: mark planning started and completed
- Update context: current focus on DO realtime planning
- Log decision: Separate realtime worker with DO + service binding
- Update system patterns: Realtime via DO/WebSocket, no polling

---

## 7. Review and Adjust

**Review Checklist:**
- Todos tracked and visible
- Active context updated to planning focus
- Decisions logged (worker separation, service binding)
- Blockers documented: none at planning stage

---

## Acceptance Criteria
- Real-time updates arrive within ~1s after webhook processing
- No polling in client code
- Dev and prod routes work; WebSocket connections stable with reconnect
- Unit and E2E tests pass in CI
- Pipeline deploys both workers; migrations applied

## Risks & Mitigations
- Route conflicts: dedicate `/realtime/*` to realtime worker
- Socket lifecycle: heartbeat + hibernation
- Ordering/duplication: sequence numbers in payloads if needed; client de-duplication

## Validation Plan
- Local mock tests using existing webhook fixture + realtime notify
- Dev deployment smoke test (health + test notify)
- Playwright E2E confirms live UI updates without refresh
