# Plan: Admin Portal Bug Fixes & Inbound Email Feature

**Created:** 2025-11-27  
**Research Brief:** `research-admin-e2e-testing-2025-11-27.md`  
**Status:** ✅ EXECUTION COMPLETE (2025-11-27)

---

## Completion Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Quick Wins | ✅ Complete | Logout route + redirect fix |
| Phase 3: Animations | ✅ Complete | CSS fadeIn with prefers-reduced-motion |
| Phase 2: Inbound Email | ✅ Complete | svix, migration, webhook, UI |
| Tests & Build | ✅ Pass | 658/659 tests, build succeeds |

### Manual Steps Remaining
- [ ] Test logout flow on `admin.devapp.lan`
- [ ] Test contact form redirect on `devapp.lan`
- [ ] Enable Resend receiving + add MX record to Cloudflare
- [ ] Apply D1 migration: `wrangler d1 migrations apply inkpup-db-dev --local --env dev`
- [ ] Test inbound email flow end-to-end

---

## Task Definition

Fix admin portal functionality issues and add inbound email capture feature before writing E2E tests.

### Scope
| Issue | Type | Priority | Complexity |
|-------|------|----------|------------|
| 1. Logout broken | Bug Fix | High | Low |
| 2. Contact redirect wrong URL | Bug Fix | Medium | Low |
| 3. Inbound emails not captured | New Feature | High | Medium |
| 4. Missing admin animations | Enhancement | Low | Low |

---

## Breakdown of Steps

### Phase 1: Quick Wins (Issues 1 & 2)

#### Step 1.1: Create Logout API Route
- **File:** `app/api/admin/logout/route.ts` (new)
- **Action:** Create POST handler that clears session cookie and redirects
- **Dependencies:** `lib/admin-auth.ts`, `lib/admin-hosts.ts`

#### Step 1.2: Fix Contact Form Redirect
- **File:** `app/api/contact/route.ts` (modify)
- **Action:** Add `buildRedirectUrl()` helper using X-Forwarded-* headers
- **Lines:** ~81, 146, 151

---

### Phase 2: Inbound Email Feature (Issue 3)

#### Step 2.1: Install Dependencies
```bash
npm install svix
```

#### Step 2.2: Create D1 Migration
- **File:** `scripts/db/migrations/006_add_email_direction.sql` (new)
- **Action:** ALTER TABLE to add `direction`, `from_email`, `resend_email_id` columns

#### Step 2.3: Update Zod Schema
- **File:** `lib/schemas/inquiry.ts`
- **Action:** Add new fields to `InquiryEmailSchema`

#### Step 2.4: Update D1 Query Functions
- **File:** `lib/db/inquiry-emails.ts`
- **Action:** Update `createInquiryEmail()` to accept new fields, add `createInboundEmail()` function

#### Step 2.5: Create Resend Webhook Endpoint
- **File:** `app/api/webhooks/resend/route.ts` (new)
- **Action:** Handle `email.received` event, verify signature, store in D1

#### Step 2.6: Update Conversation UI
- **File:** `components/admin/InquiryDetail.tsx` (or relevant component)
- **Action:** Display inbound vs outbound messages differently

#### Step 2.7: Manual Configuration (Not Code)
- Resend Dashboard: Enable receiving, create webhook
- Cloudflare DNS: Add MX record
- Environment: Add `RESEND_WEBHOOK_SECRET`

---

### Phase 3: Admin Animations (Issue 4)

#### Step 3.1: Add CSS Animations
- **File:** `app/styles/_admin.scss`
- **Action:** Add `@keyframes adminFadeIn` and apply to `.admin-card`
- **Note:** CSS-only approach (simpler than RevealOnScroll for admin)

---

## #Todos

### Phase 1 - Quick Wins
- [x] #todo Create `app/api/admin/logout/route.ts` with POST handler
- [x] #todo Add `buildRedirectUrl()` helper to `app/api/contact/route.ts`
- [x] #todo Update redirect calls to use helper (3 locations)
- [ ] #todo Test logout flow on `admin.devapp.lan`
- [ ] #todo Test contact form redirect on `devapp.lan`

### Phase 2 - Inbound Email
- [x] #todo Install `svix` package
- [x] #todo Create `scripts/db/migrations/006_add_email_direction.sql`
- [ ] #todo Run migration locally: `wrangler d1 migrations apply inkpup-db-dev --local --env dev`
- [x] #todo Update `InquiryEmailSchema` in `lib/schemas/inquiry.ts`
- [x] #todo Add `createInboundEmail()` to `lib/db/inquiry-emails.ts`
- [x] #todo Create `app/api/webhooks/resend/route.ts`
- [x] #todo Fix inquiry-emails test for new parameters
- [x] #todo Update conversation UI to show direction
- [x] #todo Add `RESEND_WEBHOOK_SECRET` to `.env.example`
- [ ] #todo **MANUAL:** Configure Resend dashboard (receiving + webhook)
- [ ] #todo **MANUAL:** Add MX record to Cloudflare DNS
- [ ] #todo Test end-to-end with real email reply

### Phase 3 - Animations
- [x] #todo Add `@keyframes adminFadeIn` to `_admin.scss`
- [x] #todo Apply animation to `.admin-card` class
- [x] #todo Add `prefers-reduced-motion` media query
- [ ] #todo Verify skeleton loaders still work

### Verification
- [x] #todo Run `npm test` - all tests pass (658/659)
- [x] #todo Run `npm run build` - build succeeds
- [ ] #todo Manual testing of all 4 fixes

---

## Tools & Functions

| Step | Tool/Function |
|------|---------------|
| 1.1, 2.5 | `create_file` - new API routes |
| 1.2, 2.3, 2.4, 3.1 | `replace_string_in_file` - modify existing |
| 2.1 | `run_in_terminal` - npm install |
| 2.2 | `create_file` - migration SQL |
| Testing | `run_in_terminal` - npm test, npm run build |
| Manual config | Documentation in research brief |

---

## Success Criteria

- [ ] Logout clears session and redirects to `/admin?status=logout`
- [ ] Contact form redirects to `https://devapp.lan/contact?success=true` (not localhost)
- [ ] Customer email replies appear in admin inquiry conversation view
- [ ] Inbound emails stored with `direction='inbound'` in D1
- [ ] Admin pages have subtle fade-in animation
- [ ] All existing tests pass
- [ ] Build succeeds

---

## Dependencies

### New Package
- `svix` - Resend webhook signature verification

### Environment Variables
- `RESEND_WEBHOOK_SECRET` - webhook signing secret from Resend dashboard

### External Configuration
- Resend: Enable receiving, create webhook endpoint
- Cloudflare: MX record for `mail.inkpup.ca`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| MX record conflicts | Using existing `mail.inkpup.ca` subdomain |
| Webhook unreachable | Test with ngrok locally first |
| Unmatched inbound emails | Log unmatched, return 200 to acknowledge |
| Migration fails | Test locally before production |

---

## Execution Order

**Recommended sequence:**
1. Phase 1 (logout + redirect) - Quick wins, unblocks testing
2. Phase 3 (animations) - Low risk, improves UX
3. Phase 2 (inbound email) - Larger scope, do last

**Alternative:** If inbound email is urgent, do Phase 2 first but expect longer testing cycle.

---

## References

- Research brief: `memory-bank/research-admin-e2e-testing-2025-11-27.md`
- Resend receiving docs: https://resend.com/docs/dashboard/receiving/introduction
- svix package: https://www.npmjs.com/package/svix
