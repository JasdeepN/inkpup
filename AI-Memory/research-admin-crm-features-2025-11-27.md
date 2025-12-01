# Research Brief: Admin Portal CRM & UX Enhancements

**Date:** 2025-11-27  
**Related:** `research-inquiry-messaging-ux-2025-11-27.md`, `plan-inquiry-messaging-ux-2025-11-27.md`

---

## Problem Statement

User identified 6 additional requirements for the admin portal beyond the messaging UX improvements:

1. **More status options** - Add "Deposit Received" status
2. **Archive confirmation** - Prevent accidental archiving
3. **Save Notes button styling** - Currently unstyled/hard to see
4. **Email blocklist** - Spam protection for unwanted senders
5. **Customer tracking** - Track customers across inquiries
6. **Deposit tracking** - Track payments received from customers

---

## Context

### Current State
- **Status options:** unread, read, replied, booked, archived
- **Archive button:** Direct action, no confirmation
- **Save Notes button:** Generic `btn btn--sm btn--outline` styling
- **Email blocklist:** None - all inbound emails accepted
- **Customer tracking:** None - inquiries are standalone
- **Deposit tracking:** None - no payment fields

### Related Files
- Schema: `lib/schemas/inquiry.ts` (InquiryStatusSchema)
- DB: `scripts/db/migrations/005_create_inquiry_tables.sql`
- UI: `components/admin/InquiryDetail.tsx`
- Styles: `app/styles/_admin.scss`

---

## Research Findings

### Issue 1: More Status Options

**Current:** `['unread', 'read', 'replied', 'booked', 'archived']`

**Proposed workflow with "Deposit Received":**
```
Inquiry → Read → Replied (deposit requested) → Deposit Received → Booked → Archived
```

**Implementation:**
1. Add `'deposit_received'` to `InquiryStatusSchema`
2. Add status tab in inquiries page
3. Add button in InquiryDetail status section
4. Update `InquiryStatusBadge` with badge color (yellow/gold)
5. D1 migration not needed (TEXT column accepts new values)

**Effort:** 1 hour

---

### Issue 2: Archive Confirmation

**Current behavior:** Single click archives immediately

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| A. Browser `confirm()` | Simple, native | Ugly, blocks JS |
| B. Custom modal component | Branded, accessible | More code |
| C. Undo toast pattern | Non-blocking, modern | Needs timeout logic |

**Recommendation:** Option B - Custom modal

Reusable `ConfirmDialog` component that can be used for other destructive actions.

```tsx
<ConfirmDialog
  open={showArchiveConfirm}
  title="Archive Inquiry"
  message="Are you sure? This will move the inquiry to archived."
  confirmText="Archive"
  onConfirm={handleArchive}
  onCancel={() => setShowArchiveConfirm(false)}
/>
```

**Effort:** 1.5 hours (reusable component)

---

### Issue 3: Save Notes Button Styling

**Current:** `btn btn--sm btn--outline mt-2` - blends into background

**Proposed:** Distinct styling with success feedback

```scss
.inquiry-detail__save-notes {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: rgba(34, 197, 94, 0.9);
  
  &:hover {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1));
    border-color: rgba(34, 197, 94, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
  }
}
```

Also consider:
- Add checkmark icon on success
- Show "Saved!" text briefly after save

**Effort:** 0.5 hours

---

### Issue 4: Email Blocklist (Spam Protection)

**Use Case:** Block senders who spam the contact form or send inappropriate content

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS blocked_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocked_emails ON blocked_emails(email);
```

**Implementation:**
1. New D1 migration for table
2. Check blocklist in `/api/contact` POST handler
3. Check blocklist in `/api/webhooks/resend` handler
4. Add "Block Sender" button to InquiryDetail
5. Admin page to view/manage blocked emails (optional)

**Effort:** 4 hours

---

### Issue 5 & 6: Customer & Deposit Tracking

**This is the largest feature request - essentially a mini-CRM**

#### Option A: Minimal - Fields on Inquiry

Add to `inquiries` table:
```sql
deposit_amount REAL,
deposit_received_at TEXT,
deposit_method TEXT  -- 'etransfer', 'paypal', 'cash'
```

| Pros | Cons |
|------|------|
| Simplest implementation | One deposit per inquiry |
| No new tables | No customer deduplication |
| Quick to build | No payment history |

**Effort:** 2 hours

#### Option B: Basic CRM (Recommended)

New tables:
```sql
-- Customers table - deduplicated by email
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  instagram TEXT,
  notes TEXT,
  total_deposits REAL DEFAULT 0,  -- cached sum
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Deposits/Payments table
CREATE TABLE IF NOT EXISTS deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  inquiry_id INTEGER,  -- nullable, may not link to inquiry
  amount REAL NOT NULL,
  method TEXT NOT NULL,  -- 'etransfer', 'paypal', 'cash', 'card'
  status TEXT DEFAULT 'received',  -- 'pending', 'received', 'refunded'
  received_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL
);

-- Link inquiries to customers
ALTER TABLE inquiries ADD COLUMN customer_id INTEGER REFERENCES customers(id);
```

**Customer auto-creation flow:**
1. New inquiry arrives
2. Check if customer exists by email
3. If not, create customer from inquiry data
4. Link inquiry.customer_id

**Admin UI:**
- `/dashboard/customers` - List all customers
- `/dashboard/customers/[id]` - Customer detail (inquiries + deposits)
- InquiryDetail shows linked customer with quick deposit add

| Pros | Cons |
|------|------|
| Customer history tracking | More complex |
| Multiple deposits per customer | New pages to build |
| Payment method tracking | Migration complexity |
| Instagram handle for reference | 8-12 hours work |

**Effort:** 12-16 hours

#### Option C: Full CRM + Appointments

Everything in Option B plus:
```sql
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  inquiry_id INTEGER,
  scheduled_at TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  deposit_id INTEGER,
  status TEXT DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled', 'no_show'
  notes TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id),
  FOREIGN KEY (deposit_id) REFERENCES deposits(id)
);
```

| Pros | Cons |
|------|------|
| Complete booking system | Much larger scope |
| Calendar integration possible | 20+ hours work |
| Appointment reminders | Needs scheduling UI |

**Recommendation:** Start with Option B, add appointments later if needed.

---

## Recommended Implementation Order

### Phase A: Quick Fixes (Add to current plan)
1. ✅ "Deposit Received" status
2. ✅ Archive confirmation dialog
3. ✅ Save Notes button styling
4. (existing) Detail page route
5. (existing) Deferred read-marking

**New effort for Phase A additions:** +3 hours

### Phase B: Customer & Deposit Tracking (Next major feature)
1. D1 migration for customers + deposits tables
2. Customer auto-creation from inquiries
3. `/dashboard/customers` list page
4. `/dashboard/customers/[id]` detail page
5. Deposit recording UI
6. InquiryDetail customer link

**Effort:** 12-16 hours (2 days)

### Phase C: Email Blocklist (Lower priority unless spam is issue)
1. D1 migration for blocked_emails
2. Block checks in API routes
3. "Block Sender" button
4. Optional: blocklist management page

**Effort:** 4 hours

---

## Technical Considerations

### Database Migrations
- Migration 008: Add `deposit_received` status support (no-op, TEXT column)
- Migration 009: Create `customers` and `deposits` tables
- Migration 010: Add `customer_id` to inquiries (nullable FK)
- Migration 011: Create `blocked_emails` table

### Auto-link Strategy
When creating inquiry → find or create customer by email, set customer_id

### Dashboard Integration
- Show total deposits in period (week/month)
- Show customers with pending deposits
- Quick stats widget

### Customer Deduplication
- Primary key: email (unique constraint)
- Handle case changes: lowercase normalize
- Merge UI (future): combine duplicate customers

---

## UI Mockups

### Deposit Received Status Button
```
[✓ Booked] [💰 Deposit Received] [Archive]
```

### Customer Section in Inquiry Detail
```
┌──────────────────────────────────────────────────────────┐
│ CUSTOMER                                                 │
│ John Doe (@johndoe_tattoos)                → View Profile│
│ 3 previous inquiries | $250 total deposits              │
├──────────────────────────────────────────────────────────┤
│ [+ Record Deposit]                                       │
│                                                          │
│ Deposit History                                          │
│ • $100 - E-Transfer - Nov 15, 2025                      │
│ • $150 - PayPal - Oct 3, 2025                           │
└──────────────────────────────────────────────────────────┘
```

### Customers List Page
```
┌──────────────────────────────────────────────────────────┐
│ 👥 Customers                           [Search...] [Add] │
├──────────────────────────────────────────────────────────┤
│ John Doe    john@example.com   $250   3 inquiries    →  │
│ Jane Smith  jane@example.com   $100   1 inquiry      →  │
│ Bob Lee     bob@example.com    $0     2 inquiries    →  │
└──────────────────────────────────────────────────────────┘
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Customer email change | Med | Allow email updates with confirmation |
| Duplicate customers created | Low | Unique constraint + case normalization |
| Deposit amount disputes | Low | Keep notes field for reference |
| Feature creep into full CRM | High | Strict scope for Phase B |

---

## Success Criteria

### Phase A (Quick Fixes)
- [ ] "Deposit Received" status visible in tabs and buttons
- [ ] Archive shows confirmation before action
- [ ] Save Notes button has distinct green styling

### Phase B (Customer Tracking)
- [ ] Customers auto-created from inquiries
- [ ] Customer list page shows all customers
- [ ] Customer detail shows inquiry history
- [ ] Deposits can be recorded with amount/method
- [ ] Dashboard shows deposit totals

### Phase C (Blocklist)
- [ ] Blocked emails rejected at API level
- [ ] "Block Sender" button in inquiry detail
- [ ] Blocked list viewable in admin

---

## References

- Current inquiry schema: `lib/schemas/inquiry.ts`
- Current migrations: `scripts/db/migrations/`
- Resend inbound webhook: `app/api/webhooks/resend/route.ts`
- InquiryDetail UI: `components/admin/InquiryDetail.tsx`
