# Implementation Plan: Inquiry Inbox + Email Templates

**Date:** 2025-11-26  
**Status:** Planning Complete  
**Research:** [research-marketing-page-2025-11-26.md](./research-marketing-page-2025-11-26.md)  
**Estimated Effort:** 2.5-3 days

---

## Task Definition

Build a complete inquiry management system with:
1. **D1 Storage** - Store all contact form submissions in database
2. **Admin Inbox** - View, filter, and manage inquiries at `/dashboard/inquiries`
3. **Email Templates** - Database-stored, editable templates at `/dashboard/templates`
4. **Reply System** - Send templated responses via Resend API
5. **Conversation History** - Track all sent emails per inquiry

---

## Prerequisites

- [x] Resend API configured (`RESEND_API_KEY`)
- [x] D1 database working
- [x] Admin authentication working
- [x] Contact form API exists (`app/api/contact/route.ts`)

---

## Phase 1: Database Schema (0.5 day)

### 1.1 Create Migration File
**File:** `scripts/db/migrations/005_create_inquiry_tables.sql`

```sql
-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT DEFAULT 'contact',
  design_id TEXT,
  message TEXT,
  placement TEXT,
  budget TEXT,
  status TEXT DEFAULT 'unread',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  replied_at TEXT,
  notes TEXT
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- Inquiry emails (sent messages)
CREATE TABLE IF NOT EXISTS inquiry_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL,
  template_id INTEGER,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiry_emails_inquiry ON inquiry_emails(inquiry_id);
```

### 1.2 Create Seed File
**File:** `scripts/db/migrations/006_seed_email_templates.sql`

Seed 4 default templates:
- `deposit_request`
- `booking_confirmed`
- `aftercare`
- `terms_policies`

### #todos Phase 1
- [ ] Create `005_create_inquiry_tables.sql`
- [ ] Create `006_seed_email_templates.sql`
- [ ] Run migrations locally
- [ ] Run migrations on dev D1
- [ ] Verify tables exist

---

## Phase 2: Zod Schemas + Types (0.25 day)

### 2.1 Create Schema File
**File:** `lib/schemas/inquiry.ts`

```typescript
import { z } from 'zod';

export const InquiryStatusSchema = z.enum([
  'unread', 'read', 'replied', 'booked', 'archived'
]);

export const InquiryTypeSchema = z.enum([
  'contact', 'flash', 'custom'
]);

export const InquirySchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  inquiry_type: InquiryTypeSchema,
  design_id: z.string().nullable(),
  message: z.string().nullable(),
  placement: z.string().nullable(),
  budget: z.string().nullable(),
  status: InquiryStatusSchema,
  created_at: z.string(),
  replied_at: z.string().nullable(),
  notes: z.string().nullable(),
});

export const EmailTemplateSchema = z.object({
  id: z.number(),
  slug: z.string().min(1),
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  is_default: z.number(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

export const CreateTemplateSchema = EmailTemplateSchema.omit({
  id: true, created_at: true, updated_at: true, is_default: true,
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export type Inquiry = z.infer<typeof InquirySchema>;
export type InquiryStatus = z.infer<typeof InquiryStatusSchema>;
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
```

### #todos Phase 2
- [ ] Create `lib/schemas/inquiry.ts`
- [ ] Add tests `lib/schemas/inquiry.test.ts`
- [ ] Export from schemas index (if exists)

---

## Phase 3: Database Functions (0.5 day)

### 3.1 Inquiry D1 Functions
**File:** `lib/db/inquiries.ts`

Functions needed:
- `createInquiry(data)` - Insert new inquiry
- `getInquiries(filters?)` - List with optional status filter
- `getInquiryById(id)` - Single inquiry with emails
- `updateInquiryStatus(id, status)` - Change status
- `updateInquiryNotes(id, notes)` - Add internal notes
- `getUnreadCount()` - For badge

### 3.2 Template D1 Functions
**File:** `lib/db/email-templates.ts`

Functions needed:
- `getTemplates()` - List all templates
- `getTemplateById(id)` - Single template
- `getTemplateBySlug(slug)` - Lookup by slug
- `createTemplate(data)` - New custom template
- `updateTemplate(id, data)` - Edit template
- `deleteTemplate(id)` - Remove (protect is_default)

### 3.3 Inquiry Emails D1 Functions
**File:** `lib/db/inquiry-emails.ts`

Functions needed:
- `createInquiryEmail(data)` - Log sent email
- `getEmailsByInquiryId(inquiryId)` - Conversation history

### #todos Phase 3
- [ ] Create `lib/db/inquiries.ts`
- [ ] Create `lib/db/email-templates.ts`
- [ ] Create `lib/db/inquiry-emails.ts`
- [ ] Add tests for all D1 functions

---

## Phase 4: Contact Form Integration (0.25 day)

### 4.1 Update Contact API
**File:** `app/api/contact/route.ts`

Changes:
1. Import `createInquiry` from D1 functions
2. After validation, call `createInquiry()` to store in D1
3. Continue with existing Resend email logic
4. Handle D1 errors gracefully (email still sends)

**Key behavior:**
- D1 storage is **non-blocking** - if it fails, email still sends
- Log error but don't fail the request
- This matches existing R2/D1 pattern in the codebase

### #todos Phase 4
- [ ] Update `app/api/contact/route.ts` to store inquiries
- [ ] Test contact form still works
- [ ] Verify inquiry appears in D1

---

## Phase 5: Admin Server Actions (0.5 day)

### 5.1 Inquiry Actions
**File:** `lib/admin-actions-inquiries.ts`

Server actions for:
- `getInquiriesAction(filter?)` - List inquiries
- `getInquiryAction(id)` - Single inquiry + emails
- `updateInquiryStatusAction(id, status)` - Mark read/archived/booked
- `updateInquiryNotesAction(id, notes)` - Add notes
- `sendReplyAction(inquiryId, templateId?, customMessage?)` - Send email

### 5.2 Template Actions
**File:** `lib/admin-actions-templates.ts`

Server actions for:
- `getTemplatesAction()` - List all
- `getTemplateAction(id)` - Single
- `createTemplateAction(formData)` - New
- `updateTemplateAction(id, formData)` - Edit
- `deleteTemplateAction(id)` - Remove

### 5.3 Send Email Logic
In `sendReplyAction`:
1. Load template (or use custom message)
2. Render variables: `{{name}}`, `{{design}}`, etc.
3. Send via Resend
4. Log to `inquiry_emails` table
5. Update inquiry status to 'replied'
6. Update `replied_at` timestamp

**Variable substitution:**
```typescript
function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}
```

### #todos Phase 5
- [ ] Create `lib/admin-actions-inquiries.ts`
- [ ] Create `lib/admin-actions-templates.ts`
- [ ] Add tests for server actions
- [ ] Test send email flow

---

## Phase 6: Admin Inbox UI (0.75 day)

### 6.1 Inquiries Page
**File:** `app/dashboard/inquiries/page.tsx`

Layout:
```
┌─────────────────────────────────────────────────────────┐
│  📬 Inquiries                        [Unread: 3]        │
├─────────────────────────────────────────────────────────┤
│  Filter: [All ▼] [Unread] [Replied] [Booked] [Archived] │
├─────────────────────────────────────────────────────────┤
│  <InquiryList items={inquiries} />                      │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Inquiry List Component
**File:** `components/admin/InquiryList.tsx`

Features:
- Show name, email, type, preview, timestamp
- Status indicator (unread dot)
- Click to expand → show full message + reply form
- Status badge (unread/replied/booked)

### 6.3 Inquiry Detail Component
**File:** `components/admin/InquiryDetail.tsx`

Features:
- Full message display
- Reply dropdown with template selection
- Custom message textarea
- Variable preview before send
- Conversation history (sent emails)
- Internal notes field
- Status change buttons

### 6.4 Reply Form Component
**File:** `components/admin/InquiryReplyForm.tsx`

Features:
- Template dropdown (fetches from D1)
- Subject/body textarea (pre-filled from template)
- Variable reference panel
- Preview rendered output
- Send button (calls sendReplyAction)

### #todos Phase 6
- [ ] Create `app/dashboard/inquiries/page.tsx`
- [ ] Create `components/admin/InquiryList.tsx`
- [ ] Create `components/admin/InquiryDetail.tsx`
- [ ] Create `components/admin/InquiryReplyForm.tsx`
- [ ] Style with existing glass-panel theme
- [ ] Test filtering and pagination

---

## Phase 7: Template Editor UI (0.5 day)

### 7.1 Templates Page
**File:** `app/dashboard/templates/page.tsx`

Layout:
```
┌─────────────────────────────────────────────────────────┐
│  📝 Email Templates                  [+ New Template]   │
├─────────────────────────────────────────────────────────┤
│  <TemplateList items={templates} />                     │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Template List Component
**File:** `components/admin/TemplateList.tsx`

Features:
- List all templates
- Show name, subject preview
- Edit/Preview/Delete buttons
- Badge for default templates (no delete)

### 7.3 Template Editor Component
**File:** `components/admin/TemplateEditor.tsx`

Features:
- Name (slug) input
- Subject input
- Body textarea (large)
- Available variables reference
- Preview with sample data
- Save/Cancel buttons

### 7.4 Template Preview Component
**File:** `components/admin/TemplatePreview.tsx`

Features:
- Render template with sample values
- Show in email-like preview pane
- Toggle between edit/preview modes

### #todos Phase 7
- [ ] Create `app/dashboard/templates/page.tsx`
- [ ] Create `components/admin/TemplateList.tsx`
- [ ] Create `components/admin/TemplateEditor.tsx`
- [ ] Create `components/admin/TemplatePreview.tsx`
- [ ] Test CRUD operations

---

## Phase 8: Navigation + Badge (0.25 day)

### 8.1 Add Nav Links
**File:** Update dashboard layout/nav

Add links:
- `/dashboard/inquiries` - "Inquiries" with unread badge
- `/dashboard/templates` - "Templates"

### 8.2 Unread Badge Component
**File:** `components/admin/UnreadBadge.tsx`

Features:
- Fetches unread count on mount
- Displays count in red badge
- Refreshes periodically or on focus

### #todos Phase 8
- [ ] Add nav links to dashboard
- [ ] Create `components/admin/UnreadBadge.tsx`
- [ ] Integrate badge with nav

---

## Phase 9: Testing + Polish (0.25 day)

### 9.1 Unit Tests
- Schema validation tests
- D1 function tests
- Server action tests

### 9.2 Integration Tests
- Contact form → D1 storage
- Reply flow → Resend + D1 logging
- Template CRUD

### 9.3 Manual Testing Checklist
- [ ] Submit contact form → appears in inbox
- [ ] Filter by status works
- [ ] Reply with template sends email
- [ ] Custom reply sends email
- [ ] Edit template → changes persist
- [ ] Create new template works
- [ ] Delete non-default template works
- [ ] Conversation history shows sent emails
- [ ] Unread badge updates

### #todos Phase 9
- [ ] Write unit tests
- [ ] Run full test suite
- [ ] Manual testing
- [ ] Fix any bugs

---

## File Manifest

### New Files (15)
| File | Purpose |
|------|---------|
| `scripts/db/migrations/005_create_inquiry_tables.sql` | D1 schema |
| `scripts/db/migrations/006_seed_email_templates.sql` | Default templates |
| `lib/schemas/inquiry.ts` | Zod schemas |
| `lib/schemas/inquiry.test.ts` | Schema tests |
| `lib/db/inquiries.ts` | Inquiry D1 functions |
| `lib/db/email-templates.ts` | Template D1 functions |
| `lib/db/inquiry-emails.ts` | Email log D1 functions |
| `lib/admin-actions-inquiries.ts` | Server actions |
| `lib/admin-actions-templates.ts` | Server actions |
| `app/dashboard/inquiries/page.tsx` | Admin inbox page |
| `app/dashboard/templates/page.tsx` | Template editor page |
| `components/admin/InquiryList.tsx` | Inquiry list |
| `components/admin/InquiryDetail.tsx` | Single inquiry view |
| `components/admin/InquiryReplyForm.tsx` | Reply form |
| `components/admin/TemplateList.tsx` | Template list |
| `components/admin/TemplateEditor.tsx` | Template form |
| `components/admin/TemplatePreview.tsx` | Preview component |
| `components/admin/UnreadBadge.tsx` | Nav badge |

### Modified Files (2)
| File | Changes |
|------|---------|
| `app/api/contact/route.ts` | Add D1 storage |
| Dashboard nav | Add new links + badge |

---

## Success Criteria

- [ ] Contact submissions stored in D1
- [ ] Admin can view all inquiries with filters
- [ ] Unread count badge visible on dashboard/nav
- [ ] Can reply with pre-built templates
- [ ] Templates support variables ({{name}}, {{design}}, etc.)
- [ ] Templates editable via admin UI
- [ ] Can create new custom templates
- [ ] Sent emails tracked per inquiry
- [ ] Can add internal notes to inquiries
- [ ] Status workflow: unread → read → replied → booked/archived
- [ ] Build passes
- [ ] All tests pass

---

## Dependencies

- **Resend API** - Already configured
- **D1 Database** - Already working
- **Existing patterns** - Glass panel theme, server actions

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| D1 storage fails | Non-blocking - email still sends |
| Resend quota | Monitor usage, 3000/mo free tier |
| Template variables missing | Default to empty string |
| Large inquiry volume | Add pagination in Phase 9 if needed |

---

## Execution Order

1. **Day 1 AM:** Phase 1 (Schema) + Phase 2 (Types)
2. **Day 1 PM:** Phase 3 (D1 Functions) + Phase 4 (Contact API)
3. **Day 2 AM:** Phase 5 (Server Actions)
4. **Day 2 PM:** Phase 6 (Inbox UI)
5. **Day 3 AM:** Phase 7 (Template Editor)
6. **Day 3 PM:** Phase 8 (Nav) + Phase 9 (Testing)

---

*Plan created: 2025-11-26*
*Ready for execution*
