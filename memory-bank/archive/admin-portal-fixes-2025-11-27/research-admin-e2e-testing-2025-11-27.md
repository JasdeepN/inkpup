# Research Brief: Admin Portal Bug Fixes

## Problem Statement

The admin portal has several functionality issues that must be fixed before E2E tests can be written:
1. **Logout is broken** - AdminNav posts to `/api/admin/logout` which doesn't exist
2. **Contact form redirect issue** - After form submission, redirects to `https://localhost:3002/contact?success=true` through reverse proxy, causing wrong URL display
3. **Inbound email replies not captured** - When customer replies to admin's email, reply reaches Resend but is NOT captured/displayed in admin dashboard (no webhook endpoint)
4. **Missing animations on admin pages** - Inquiries, Templates, and page transitions lack entrance animations present on public pages

## Context

- **Related Work**: Unit tests created (658 passing), admin components tested
- **Current State**: Local dev uses Traefik for `devapp.lan` and `admin.devapp.lan`
- **Constraints**: Fix functionality before writing E2E tests

## Research Findings

### Issue 1: Logout API Missing

**Current State:**
- `AdminNav.tsx` uses `<form action="/api/admin/logout" method="POST">`
- Route `/api/admin/logout/route.ts` does not exist
- Server action `logoutAction()` exists in `lib/actions/admin-logout.ts`

**Options:**
1. Create API route `/api/admin/logout/route.ts` that clears cookie and redirects
2. Change AdminNav to use server action via form with `action={logoutAction}`

**Recommendation:** Option 1 - Create API route for consistency with form action pattern

**Implementation:**
```typescript
// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieClearOptions } from '@/lib/admin-auth';
import { cookies } from 'next/headers';
import { ADMIN_PUBLIC_BASE_PATH } from '@/lib/admin-hosts';

export async function POST(request: NextRequest) {
  const { name, options } = getSessionCookieClearOptions();
  const store = await cookies();
  store.set(name, '', options);
  
  // Use forwarded headers for correct redirect URL
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost || request.headers.get('host') || 'localhost';
  const proto = forwardedProto || 'http';
  
  const redirectUrl = new URL(`${ADMIN_PUBLIC_BASE_PATH}?status=logout`, `${proto}://${host}`);
  return NextResponse.redirect(redirectUrl, 303);
}
```

### Issue 2: Contact Form Success Redirect

**Current State:**
- `/api/contact/route.ts` lines 81, 146, 151 use `NextResponse.redirect(url, 303)`
- URL is built from `request.url` which in reverse proxy scenarios inherits internal origin
- Success message shows correctly, but URL shows `https://localhost:3002` instead of `https://devapp.lan`

**Root Cause:** `new URL('/contact', request.url)` inherits scheme/host from the original request URL, which behind a reverse proxy is the internal address.

**Implementation:**
```typescript
// Helper function to build redirect URL respecting proxy headers
function buildRedirectUrl(request: NextRequest, path: string, params?: Record<string, string>): URL {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost || request.headers.get('host') || new URL(request.url).host;
  const proto = forwardedProto || (request.url.startsWith('https') ? 'https' : 'http');
  
  const url = new URL(path, `${proto}://${host}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return url;
}

// Usage:
return NextResponse.redirect(buildRedirectUrl(request, '/contact', { success: 'true' }), 303);
```

### Issue 3: Inbound Email Replies Not Captured (CRITICAL - NEW FEATURE)

**Current State:**
- Admin sends reply to customer → Email delivered ✅ → Saved to D1 ✅ → Shows in UI ✅
- Customer receives email and replies back → Reply reaches Resend ✅
- **MISSING**: No webhook to capture `email.received` event → Reply not visible in admin dashboard ❌

**This is NOT a bug - it's a missing feature. The outbound flow works perfectly.**

**How Resend Inbound Works:**
1. Enable "Receiving" for domain in Resend dashboard
2. Add MX record to DNS (Cloudflare)
3. Create webhook endpoint subscribing to `email.received` event
4. Resend sends POST to webhook with email metadata
5. Call `resend.emails.receiving.get(email_id)` to get full content
6. Store in D1 and display in conversation

**Required Changes:**

#### 1. Resend Dashboard Setup (Manual)
```
1. Go to https://resend.com/domains
2. Click on mail.inkpup.ca domain
3. Enable "Receiving" toggle
4. Copy the MX record shown
5. Add MX record to Cloudflare DNS for mail.inkpup.ca
6. Wait for verification

7. Go to https://resend.com/webhooks
8. Click "Add Webhook"
9. URL: https://inkpup.ca/api/webhooks/resend
10. Select event: email.received
11. Copy the signing secret for RESEND_WEBHOOK_SECRET
```

#### 2. D1 Migration (new file: `006_add_email_direction.sql`)
```sql
-- Add columns to support inbound emails
ALTER TABLE inquiry_emails ADD COLUMN direction TEXT DEFAULT 'outbound';
ALTER TABLE inquiry_emails ADD COLUMN from_email TEXT;
ALTER TABLE inquiry_emails ADD COLUMN resend_email_id TEXT;

-- Record this migration
INSERT INTO schema_migrations (version, name) VALUES (6, '006_add_email_direction');
```

#### 3. Schema Update (`lib/schemas/inquiry.ts`)
```typescript
export const InquiryEmailSchema = z.object({
  id: z.number(),
  inquiry_id: z.number(),
  template_id: z.number().nullable(),
  subject: z.string(),
  body: z.string(),
  sent_at: z.string(),
  direction: z.enum(['inbound', 'outbound']).default('outbound'),
  from_email: z.string().nullable(),
  resend_email_id: z.string().nullable(),
});
```

#### 4. Webhook Endpoint (`app/api/webhooks/resend/route.ts`)
```typescript
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Webhook } from 'svix';
import { getD1Binding } from '@/lib/db/d1';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const headers = {
    'svix-id': request.headers.get('svix-id') ?? '',
    'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
    'svix-signature': request.headers.get('svix-signature') ?? '',
  };

  // Verify webhook signature
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Resend Webhook] Missing RESEND_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let event;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, headers);
  } catch (err) {
    console.error('[Resend Webhook] Verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (event.type === 'email.received') {
    // Get full email content
    const { data: email } = await resend.emails.receiving.get(event.data.email_id);
    
    // Extract sender email (strip display name)
    const fromMatch = event.data.from.match(/<(.+)>/) || [null, event.data.from];
    const senderEmail = fromMatch[1]?.toLowerCase();

    // Find matching inquiry by sender email
    const db = getD1Binding();
    if (!db) {
      console.error('[Resend Webhook] D1 not available');
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const inquiry = await db
      .prepare('SELECT id FROM inquiries WHERE LOWER(email) = ?')
      .bind(senderEmail)
      .first<{ id: number }>();

    if (!inquiry) {
      console.warn(`[Resend Webhook] No inquiry found for email: ${senderEmail}`);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ ok: true, matched: false });
    }

    // Insert inbound email into conversation
    await db.prepare(`
      INSERT INTO inquiry_emails (inquiry_id, subject, body, from_email, direction, resend_email_id, sent_at)
      VALUES (?, ?, ?, ?, 'inbound', ?, CURRENT_TIMESTAMP)
    `).bind(
      inquiry.id,
      event.data.subject,
      email?.text || email?.html || '(no body)',
      senderEmail,
      event.data.email_id
    ).run();

    // Update inquiry status to indicate new reply
    await db.prepare(`
      UPDATE inquiries SET status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(inquiry.id).run();

    console.log(`[Resend Webhook] Inbound email added to inquiry ${inquiry.id}`);
    return NextResponse.json({ ok: true, matched: true, inquiryId: inquiry.id });
  }

  return NextResponse.json({ ok: true });
}
```

#### 5. Install svix Package
```bash
npm install svix
```

#### 6. Environment Variable
Add to `.env` and GitHub secrets:
```
RESEND_WEBHOOK_SECRET=whsec_xxxxxx
```

#### 7. UI Update - Show Direction in Conversation
```tsx
// In inquiry detail conversation view
{email.direction === 'inbound' ? (
  <div className="bg-gray-100 p-3 rounded-lg ml-8">
    <span className="text-sm text-gray-500">Customer replied:</span>
    <p>{email.body}</p>
  </div>
) : (
  <div className="bg-blue-100 p-3 rounded-lg mr-8">
    <span className="text-sm text-gray-500">You sent:</span>
    <p>{email.body}</p>
  </div>
)}
```

**Matching Strategy:**
- Primary: Match by sender email address → `inquiries.email`
- This works because the customer's email is stored when they submit the contact form
- Edge case: Customer uses different email to reply → Won't match (acceptable)

**Notification Options (Future Enhancement):**
1. Email notification to admin when new inbound received
2. Browser push notification
3. Dashboard badge counter for unread replies

## Technical Considerations

### Dependencies
- **NEW**: `svix` package for Resend webhook signature verification
- Uses existing Next.js and D1 capabilities

### Integration Points
- `app/api/admin/logout/route.ts` - New file
- `app/api/contact/route.ts` - Modify redirect logic
- `app/api/webhooks/resend/route.ts` - **NEW** webhook endpoint for inbound emails
- `lib/schemas/inquiry.ts` - Add direction, from_email, resend_email_id fields
- `lib/db/inquiry-emails.ts` - Update to handle inbound emails
- D1 migration: `006_add_email_direction.sql`

### External Configuration Required
1. **Resend Dashboard**: Enable receiving, add MX record, create webhook
2. **Cloudflare DNS**: Add MX record for mail.inkpup.ca
3. **Environment**: Add RESEND_WEBHOOK_SECRET

### Testing Strategy
1. Fix logout API route (quick win)
2. Fix contact form redirect
3. Create inbound email infrastructure:
   - Run D1 migration
   - Create webhook endpoint
   - Configure Resend dashboard
4. Test with real email reply
5. Add entrance animations to admin pages
6. Manual testing of all flows

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| MX record conflicts with existing email | High | Low | Use mail.inkpup.ca subdomain (already in use for sending) |
| Webhook endpoint not reachable from Resend | High | Med | Test with ngrok locally, verify production URL works |
| Customer replies from different email | Med | Med | Log unmatched emails, consider manual association UI |
| Redirect fix breaks non-proxy setups | Med | Med | Test both direct and proxied access |
| D1 migration fails | Med | Low | Test locally first, backup before prod |

## Implementation Readiness

### Prerequisites
- [x] Research complete
- [x] Root causes identified
- [x] Dependencies identified (none new)
- [x] Design decisions made

### Success Criteria
- [ ] Logout works (clears session, redirects to login)
- [ ] Contact form redirects to correct host after submission
- [ ] Customer replies appear in admin inquiry conversation view
- [ ] Inbound emails stored in D1 with direction='inbound'
- [ ] Admin pages have subtle entrance animations

### Next Steps for Planning
1. Create `/api/admin/logout/route.ts`
2. Update `/api/contact/route.ts` with `buildRedirectUrl` helper
3. **Inbound Email Feature (larger scope):**
   - Install `svix` package
   - Create D1 migration `006_add_email_direction.sql`
   - Update schema and types in `lib/schemas/inquiry.ts`
   - Create webhook endpoint `/api/webhooks/resend/route.ts`
   - Update UI to show inbound vs outbound in conversation
   - Configure Resend dashboard (manual)
   - Add MX record to Cloudflare DNS (manual)
4. Add entrance animations to admin pages (CSS or RevealOnScroll)
5. Manual testing of all flows

## References
- Existing middleware: `lib/middleware.ts`
- Admin hosts: `lib/admin-hosts.ts`
- D1 inquiry emails: `lib/db/inquiry-emails.ts`
- Send reply action: `lib/admin-actions-inquiries.ts` (line 173-240)
- Resend receiving docs: https://resend.com/docs/dashboard/receiving/introduction
- Resend webhook verification: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
- svix package: https://www.npmjs.com/package/svix

---

## Issue 4: Missing Animations on Admin Pages

### Current State

**Public pages have (documented in systemPatterns.md):**
- `RevealOnScroll` wrapper for scroll-triggered entrance animations
- `TransitionLink` for View Transitions API page navigation
- `PageTransitionWrapper` for route-based transition names
- Staggered delay patterns (0ms, 100ms, 150ms, etc.)

**Admin pages have:**
- ✅ Skeleton loading states (shimmer animation via CSS)
- ❌ NO entrance animations (content appears instantly)
- ❌ NO page transition animations (regular `<Link>` and `<a>` tags)
- ❌ NO `PageTransitionWrapper` in admin layout

### Specific Issues Found

| Page | Component | Issue |
|------|-----------|-------|
| `/dashboard/inquiries` | `StatusTab` | Uses `<a href>` causing full page reload, no transitions |
| `/dashboard/inquiries` | Page content | No RevealOnScroll, appears instantly |
| `/dashboard/templates` | Page content | No RevealOnScroll, appears instantly |
| `/dashboard/templates/[id]` | Editor | No entrance animation |
| `AdminNav` | Navigation links | Uses `<Link>` not `<TransitionLink>` |
| `dashboard/layout.tsx` | Layout wrapper | No `PageTransitionWrapper` |

### Root Cause

Admin pages were built focusing on functionality without the animation layer that was added to public pages later. The animation system (RevealOnScroll, TransitionLink, PageTransitionWrapper) was documented in systemPatterns.md but not applied to admin.

### Options

**Option A: Full Animation Parity**
- Add RevealOnScroll to all admin page content
- Replace Link with TransitionLink in AdminNav
- Add PageTransitionWrapper to admin layout
- Pros: Consistent UX across entire site
- Cons: May feel slow for power users, more maintenance

**Option B: Subtle Entrance Animations Only (Recommended)**
- Add RevealOnScroll with fast delays (0ms, 50ms) to admin pages
- Keep regular Link for fast navigation (no page transitions)
- Skip PageTransitionWrapper for admin
- Pros: Polished feel without slowing down admin workflow
- Cons: Slight inconsistency with public pages

**Option C: CSS-Only Animations**
- Add `animation: fadeIn 0.3s` to admin-card class
- No component changes needed
- Pros: Simplest implementation
- Cons: Less control, no scroll-triggered reveals

### Recommended Approach

**Option B: Subtle Entrance Animations Only**

Admin users prioritize speed over smoothness. Add minimal entrance animations but keep navigation instant.

**Implementation:**
```tsx
// app/dashboard/inquiries/page.tsx
import RevealOnScroll from '@/components/animations/RevealOnScroll';

export default async function InquiriesPage({ searchParams }: PageProps) {
  // ...
  return (
    <div className="admin-shell">
      <RevealOnScroll delay={0}>
        <div className="admin-card">
          {/* ... */}
        </div>
      </RevealOnScroll>
    </div>
  );
}
```

**CSS Alternative (simpler):**
```scss
// _admin.scss
.admin-card {
  animation: adminFadeIn 0.25s ease-out;
}

@keyframes adminFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Pages to Update
1. `app/dashboard/inquiries/page.tsx`
2. `app/dashboard/templates/page.tsx`
3. `app/dashboard/templates/new/page.tsx`
4. `app/dashboard/templates/[id]/page.tsx`
5. `app/dashboard/pricing/page.tsx` (verify)
6. `app/dashboard/hero/page.tsx` (verify)
7. `app/dashboard/diagnostics/page.tsx` (verify)
8. `app/dashboard/page.tsx` (main dashboard)
9. `app/gallery/page.tsx` (admin gallery)

### Success Criteria
- [ ] Admin pages have subtle fade-in entrance animation
- [ ] Animation respects prefers-reduced-motion
- [ ] Navigation between admin pages remains fast (no View Transitions delay)
- [ ] Skeleton loaders still work during async data fetching

### Next Steps for Planning
1. Decide between RevealOnScroll or CSS-only approach
2. Add entrance animation to admin pages
3. Test with prefers-reduced-motion enabled
4. Verify skeleton loaders still appear correctly
