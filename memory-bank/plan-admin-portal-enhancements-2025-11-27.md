# Plan: Admin Portal Enhancements

**Created:** 2025-11-27  
**Research Briefs:**
- `research-inquiry-messaging-ux-2025-11-27.md`
- `research-admin-crm-features-2025-11-27.md`

**Status:** Ready for execution

---

## Task Definition

Comprehensive improvements to the admin inquiry system spanning UX, workflow, and data management:

| # | Feature | Category | Phase |
|---|---------|----------|-------|
| 1 | Dedicated detail view (URL-based routing) | UX | A |
| 2 | Deferred read-marking (action-based) | UX | A |
| 3 | "Deposit Received" status | Workflow | A |
| 4 | Archive confirmation dialog | UX | A |
| 5 | Save Notes button styling | UI | A |
| 6 | Customer & deposit tracking | CRM | B |
| 7 | Email blocklist | Spam | C |

---

## Scope by Phase

### Phase A: UX & Workflow (This Plan) — ~10 hours
- Detail page route `/dashboard/inquiries/[id]`
- Link-based navigation (replace accordion)
- Deferred read-marking with explicit button
- "Deposit Received" status throughout
- `ConfirmDialog` component for archive
- Save Notes button green styling
- Tests and polish

### Phase B: Customer & Deposit CRM — ~14 hours (Future)
- `customers` and `deposits` D1 tables
- Auto-link inquiries → customers
- `/dashboard/customers` pages
- Deposit recording UI

### Phase C: Email Blocklist — ~4 hours (Future, if needed)
- `blocked_emails` table
- API rejection checks
- "Block Sender" button

---

## Phase A Implementation

### 1. Detail Page Route (Infrastructure)
**Estimated:** 2 hours

| # | Todo | Files | Status |
|---|------|-------|--------|
| 1.1 | Create server component for detail route | `app/dashboard/inquiries/[id]/page.tsx` | ⬜ |
| 1.2 | Create client wrapper with back button layout | `components/admin/InquiryDetailPage.tsx` | ⬜ |
| 1.3 | Verify `getInquiryAction` exists (already does) | `lib/admin-actions-inquiries.ts` | ⬜ |
| 1.4 | Add detail page styles | `app/styles/_admin.scss` | ⬜ |

### 2. List View Refactor (Navigation)
**Estimated:** 1.5 hours

| # | Todo | Files | Status |
|---|------|-------|--------|
| 2.1 | Remove accordion state (`expandedId`) | `components/admin/InquiryList.tsx` | ⬜ |
| 2.2 | Change rows to Link components | `components/admin/InquiryList.tsx` | ⬜ |
| 2.3 | Remove inline `InquiryDetail` rendering | `components/admin/InquiryList.tsx` | ⬜ |
| 2.4 | Pass `?from=<status>` for back navigation | `components/admin/InquiryList.tsx` | ⬜ |

### 3. Status Enhancements
**Estimated:** 1.5 hours

| # | Todo | Files | Status |
|---|------|-------|--------|
| 3.1 | Add `'deposit_received'` to schema | `lib/schemas/inquiry.ts` | ⬜ |
| 3.2 | Add "💰 Deposit" tab to inquiries page | `app/dashboard/inquiries/page.tsx` | ⬜ |
| 3.3 | Add "Deposit Received" button to status section | `components/admin/InquiryDetail.tsx` | ⬜ |
| 3.4 | Add gold badge color for deposit status | `components/admin/InquiryList.tsx` | ⬜ |
| 3.5 | Update schema tests | `lib/schemas/inquiry.test.ts` | ⬜ |

### 4. Archive Confirmation
**Estimated:** 1.5 hours

| # | Todo | Files | Status |
|---|------|-------|--------|
| 4.1 | Create `ConfirmDialog` component | `components/admin/ConfirmDialog.tsx` | ⬜ |
| 4.2 | Add SCSS for modal styling | `app/styles/_admin.scss` | ⬜ |
| 4.3 | Wire archive button to show dialog | `components/admin/InquiryDetail.tsx` | ⬜ |
| 4.4 | Create component tests | `components/admin/ConfirmDialog.test.tsx` | ⬜ |

### 5. Save Notes Styling
**Estimated:** 0.5 hours

| # | Todo | Files | Status |
|---|------|-------|--------|
| 5.1 | Add `.inquiry-detail__save-notes` class | `app/styles/_admin.scss` | ⬜ |
| 5.2 | Apply class to Save Notes button | `components/admin/InquiryDetail.tsx` | ⬜ |
| 5.3 | Add success feedback (checkmark on save) | `components/admin/InquiryDetail.tsx` | ⬜ |

### 6. Deferred Read Marking
**Estimated:** 2 hours

| # | Todo | Files | Status |
|---|------|-------|--------|
| 6.1 | Remove auto-mark-read from useEffect | `components/admin/InquiryDetail.tsx` | ⬜ |
| 6.2 | Add "Mark as Read" button (header) | `components/admin/InquiryDetailPage.tsx` | ⬜ |
| 6.3 | Add "Mark as Unread" button | `components/admin/InquiryDetailPage.tsx` | ⬜ |
| 6.4 | Auto-mark on back button click | `components/admin/InquiryDetailPage.tsx` | ⬜ |
| 6.5 | Auto-mark on status change | `components/admin/InquiryDetail.tsx` | ⬜ |
| 6.6 | Auto-mark on save notes | `components/admin/InquiryDetail.tsx` | ⬜ |
| 6.7 | Auto-mark on send reply | `components/admin/InquiryDetail.tsx` | ⬜ |

### 7. Testing & Polish
**Estimated:** 2 hours

| # | Todo | Files | Status |
|---|------|-------|--------|
| 7.1 | Update InquiryList tests (link nav) | `components/admin/InquiryList.test.tsx` | ⬜ |
| 7.2 | Update InquiryDetail tests | `components/admin/InquiryDetail.test.tsx` | ⬜ |
| 7.3 | Create InquiryDetailPage tests | `components/admin/InquiryDetailPage.test.tsx` | ⬜ |
| 7.4 | Manual test: all flows + mobile | — | ⬜ |
| 7.5 | Run `npm test`, `npm run build` | — | ⬜ |

---

## File Changes Summary

### New Files (6)
```
app/dashboard/inquiries/[id]/page.tsx        # Server component
components/admin/InquiryDetailPage.tsx       # Client wrapper
components/admin/InquiryDetailPage.test.tsx  # Tests
components/admin/ConfirmDialog.tsx           # Reusable modal
components/admin/ConfirmDialog.test.tsx      # Tests
```

### Modified Files (8)
```
lib/schemas/inquiry.ts                       # Add deposit_received
lib/schemas/inquiry.test.ts                  # Update tests
components/admin/InquiryList.tsx             # Link nav, remove accordion
components/admin/InquiryList.test.tsx        # Update tests
components/admin/InquiryDetail.tsx           # Deferred read, confirmation
components/admin/InquiryDetail.test.tsx      # Update tests
app/dashboard/inquiries/page.tsx             # Add deposit tab
app/styles/_admin.scss                       # New styles
```

---

## Technical Details

### Status Flow (Updated)
```
unread → read → replied → deposit_received → booked → archived
                    ↓              ↓           ↓
              (deposit req)   (payment)   (appt set)
```

### URL Structure
```
/dashboard/inquiries                    # List view
/dashboard/inquiries?status=unread      # Filtered list
/dashboard/inquiries/123                # Detail view
/dashboard/inquiries/123?from=unread    # Detail with back-filter
```

### Read-Marking Triggers
| Action | Marks as Read |
|--------|---------------|
| Opening message | ❌ No |
| Click "Mark as Read" | ✅ Yes |
| Click "Back to messages" | ✅ Yes (if unread) |
| Change status (any) | ✅ Yes |
| Save notes | ✅ Yes |
| Send reply | ✅ Yes |

### ConfirmDialog API
```tsx
<ConfirmDialog
  open={boolean}
  title="Archive Inquiry"
  message="Are you sure? You can unarchive later."
  confirmText="Archive"
  confirmVariant="danger"  // 'danger' | 'primary'
  onConfirm={() => void}
  onCancel={() => void}
/>
```

### Save Notes Button Styling
```scss
.inquiry-detail__save-notes {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: rgba(34, 197, 94, 1);
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.1));
    border-color: rgba(34, 197, 94, 0.6);
  }
}
```

### Status Badge Colors
| Status | Color | Emoji |
|--------|-------|-------|
| unread | Blue | 🔵 |
| read | Gray | ⚪ |
| replied | Cyan | 💬 |
| deposit_received | Gold/Yellow | 💰 |
| booked | Green | ✅ |
| archived | Dark gray | 📦 |

---

## UI Mockups

### Inquiries List (`/dashboard/inquiries`)
```
┌─────────────────────────────────────────────────────────────────┐
│ 📬 Inquiries                                     [3 unread]     │
├─────────────────────────────────────────────────────────────────┤
│ [All][Unread][Read][Replied][💰 Deposit][Booked][Archived]      │
├─────────────────────────────────────────────────────────────────┤
│ 🔵 John Doe   john@example.com  🎨  Flash booking...      2h  → │
│ 🔵 Jane Sm    jane@example.com  ✨  Custom request...     1d  → │
│ 💰 Bob Lee    bob@example.com   💬  Deposit sent...       3d  → │
│ ✅ Alice W    alice@example.com 🎨  Confirmed appt...     5d  → │
└─────────────────────────────────────────────────────────────────┘
```

### Inquiry Detail (`/dashboard/inquiries/123`)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to messages                    [Mark as Read] [Unread]   │
├─────────────────────────────────────────────────────────────────┤
│ John Doe                                          🔵 UNREAD     │
│ john@example.com · 🎨 Flash                         2 hours ago │
├─────────────────────────────────────────────────────────────────┤
│ MESSAGE                                                         │
│ I'd like to book a flash tattoo appointment. I saw design #42   │
│ and would love to get it on my forearm. Available weekends.     │
├─────────────────────────────────────────────────────────────────┤
│ DETAILS                                                         │
│ Phone: 555-1234   Design: #42   Placement: Forearm              │
├─────────────────────────────────────────────────────────────────┤
│ STATUS                                                          │
│ [✓ Booked] [💰 Deposit Received] [Archive]                      │
├─────────────────────────────────────────────────────────────────┤
│ INTERNAL NOTES                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Requested Saturday appointment...                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ [💾 Save Notes]  ← green styled button                          │
├─────────────────────────────────────────────────────────────────┤
│ CONVERSATION HISTORY                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📤 You - Deposit Request for Your Tattoo...    Nov 27 11:30p│ │
│ │ Thanks for reaching out! To secure your appointment...      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📥 Customer - Re: Deposit Request...           Nov 28  9:15a│ │
│ │ Just sent $100 via e-transfer!                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                         [✉️ Reply]                              │
└─────────────────────────────────────────────────────────────────┘
```

### Archive Confirmation Dialog
```
┌─────────────────────────────────────────┐
│ 📦 Archive Inquiry                      │
│                                         │
│ Are you sure you want to archive this   │
│ inquiry from John Doe?                  │
│                                         │
│ You can unarchive it later from the     │
│ Archived tab.                           │
│                                         │
│              [Cancel]  [Archive]        │
└─────────────────────────────────────────┘
```

---

## Success Criteria

### Phase A (This Plan)
- [ ] Detail view at `/dashboard/inquiries/[id]` works
- [ ] List uses links instead of accordion
- [ ] Messages only marked read on action or explicit button
- [ ] "Deposit Received" status in tabs, buttons, badges
- [ ] Archive shows confirmation dialog
- [ ] Save Notes button visually distinct (green)
- [ ] Browser back navigation works
- [ ] Mobile responsive
- [ ] All tests pass
- [ ] Build succeeds, lint clean

### Phase B (Future)
- [ ] Customers auto-created from inquiries
- [ ] Customer list page functional
- [ ] Deposits recordable with amount/method
- [ ] Dashboard shows deposit totals

### Phase C (Future)
- [ ] Blocked emails rejected at API
- [ ] "Block Sender" button works
- [ ] Blocklist viewable in admin

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Filter lost on back nav | Med | Pass `?from=<status>` param |
| Read not marked on browser close | Low | Accept - user has manual button |
| Mobile layout breaks | Med | Test responsive thoroughly |
| ConfirmDialog not accessible | Med | ARIA roles, focus trap, ESC close |
| Status badge colors conflict | Low | Use distinct hues, test color blind |

---

## Future Work

### Phase B: Customer & Deposit Tracking
**When:** After Phase A stable  
**Effort:** ~14 hours

New D1 tables:
```sql
-- customers (email unique, auto-created from inquiries)
-- deposits (customer_id, inquiry_id, amount, method, status)
-- inquiries.customer_id FK
```

New pages:
- `/dashboard/customers` - list
- `/dashboard/customers/[id]` - detail with deposits

### Phase C: Email Blocklist
**When:** If spam becomes an issue  
**Effort:** ~4 hours

- `blocked_emails` table
- Check in `/api/contact` and `/api/webhooks/resend`
- "Block Sender" button in inquiry detail

---

## Execution Order

```
1. Schema update (deposit_received) → quick, unblocks UI work
2. ConfirmDialog component → reusable, unblocks archive UI
3. Detail page route → core infrastructure
4. List refactor (links) → depends on detail route
5. Deferred read-marking → depends on detail page
6. Status/UI enhancements → can parallel with 4-5
7. Styling (Save Notes, badges) → polish pass
8. Tests → throughout + final pass
9. Build verification → gate before merge
```

---

## References

- Research: `memory-bank/research-inquiry-messaging-ux-2025-11-27.md`
- Research: `memory-bank/research-admin-crm-features-2025-11-27.md`
- Inquiry schema: `lib/schemas/inquiry.ts`
- Admin styles: `app/styles/_admin.scss`
- InquiryList: `components/admin/InquiryList.tsx`
- InquiryDetail: `components/admin/InquiryDetail.tsx`
- Inquiries page: `app/dashboard/inquiries/page.tsx`
