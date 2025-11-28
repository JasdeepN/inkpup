# Research Brief: Inquiry Messaging UX Improvements

## Problem Statement

Two UX issues with the admin inquiry messaging system:

1. **Premature Read Status**: Messages are marked as "read" immediately upon opening, even if admin just misclicked. Should only mark as read when admin intentionally navigates away (commits to having seen it).

2. **Accordion Layout Scalability**: Current accordion-style inline expansion doesn't scale well with 100+ messages. User wants dedicated detail view with:
   - No status filter tabs when viewing a message
   - "Back to messages" button instead
   - Full-focus layout on selected message

## Context

- **Related Work:** Inquiry inbox implemented 2025-11-26 (plan archived)
- **Current State:** 
  - `InquiryList.tsx` - accordion pattern with `expandedId` state
  - `InquiryDetail.tsx` - inline component, marks read in `useEffect` on mount
  - `app/dashboard/inquiries/page.tsx` - server component with status tabs
- **Constraints:** 
  - Must work with existing D1 database schema
  - Server actions for state changes
  - Mobile-friendly (touch targets, responsive)

## Research Findings

### Issue 1: Read Status Timing

#### Current Implementation
```tsx
// InquiryDetail.tsx, lines 38-44
useEffect(() => {
  // ... load data
  if (inquiry.status === 'unread') {
    startTransition(async () => {
      await updateInquiryStatusAction(inquiry.id, 'read');
    });
  }
}, [inquiry.id, inquiry.status]);
```

Problem: Marks read immediately on mount, even on accidental clicks.

#### Option A: Time-delayed marking
- **Description:** Mark as read after 3-5 seconds of viewing
- **Pros:** Simple to implement, accounts for "glance and leave"
- **Cons:** Arbitrary timing, user might want faster/slower, doesn't feel intentional
- **Effort:** 1 hour

#### Option B: Mark on navigation away (useEffect cleanup)
- **Description:** Track `wasUnread`, mark in cleanup function when unmounting
- **Pros:** Matches user intent (committed to viewing), automatic
- **Cons:** Cleanup is async, might not complete; doesn't work well with page navigation
- **Effort:** 2 hours

#### Option C: Mark on intentional action
- **Description:** Mark as read when user performs ANY action (reply, status change, save notes, click back)
- **Pros:** Most intentional, user clearly engaged with the message
- **Cons:** Message stays unread if user only reads without acting
- **Effort:** 2 hours

#### Option D: Hybrid - Action-based + "Mark as Read" button
- **Description:** Auto-mark on any action, provide explicit "Mark as Read" button for read-only viewing
- **Pros:** Best of both worlds - intentional + explicit control
- **Cons:** Extra UI element
- **Effort:** 3 hours

### Recommended Approach for Issue 1: Option D (Hybrid)

Mark as read automatically when:
- Clicking "Back to messages" button
- Changing status (Booked, Archive)
- Saving notes  
- Sending reply

Provide "Mark as Read" button for cases where admin just reads without acting.

### Issue 2: Detail View Layout

#### Current Implementation
- `InquiryList` maintains `expandedId` state
- `InquiryDetail` rendered inline within list item
- Status tabs always visible at top
- Accordion pattern scales poorly with many messages

#### Option A: State-based view switching (no routing)
- **Description:** `InquiryList` manages `selectedId` state; null = list view, number = detail view
- **Pros:** Simple, fast transitions, no new files
- **Cons:** Loses browser back button, can't bookmark/share, mixing concerns
- **Effort:** 4 hours

#### Option B: URL-based routing with dynamic segment
- **Description:** Create `/dashboard/inquiries/[id]/page.tsx` for detail view
- **Pros:** Browser back works, shareable URLs, clean separation, SSR
- **Cons:** More files, server round-trip on navigation
- **Effort:** 6 hours

#### Option C: Modal overlay
- **Description:** Full-screen modal for detail view
- **Pros:** Fast, overlay pattern
- **Cons:** Not what user wants (wants dedicated view), accessibility concerns
- **Effort:** 3 hours

### Recommended Approach for Issue 2: Option B (URL routing)

Create dedicated route `/dashboard/inquiries/[id]` that:
1. Fetches single inquiry server-side
2. Renders `InquiryDetailPage` wrapper with:
   - "← Back to messages" button (no status tabs)
   - Full-width `InquiryDetail` component
   - Clean focused layout
3. `InquiryList` becomes clickable links instead of accordion toggles

## Technical Considerations

### Dependencies
- No new packages required
- Uses existing server actions (`getInquiryAction`, `updateInquiryStatusAction`)
- Uses existing `InquiryDetail` component (modified)

### Integration Points

#### Files to Create
1. `app/dashboard/inquiries/[id]/page.tsx` - Server component, data fetching
2. `components/admin/InquiryDetailPage.tsx` - Client wrapper with back button layout

#### Files to Modify
1. `components/admin/InquiryList.tsx` - Change from accordion to link-based
2. `components/admin/InquiryDetail.tsx` - Remove auto-mark-read, add deferred logic
3. `app/styles/_admin.scss` - Add detail page styles

### Testing Strategy
- Unit tests for new components
- Update existing InquiryList/InquiryDetail tests
- Manual E2E testing for navigation flow
- Test read-status timing behavior

### Deployment Impact
- No migrations required
- No environment changes
- Backward compatible (existing data works)

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Read status not marked if browser closes | Low | Medium | Accept - user can mark manually |
| Back button doesn't work as expected | Medium | Low | Use standard Link navigation |
| Slow navigation due to SSR | Low | Low | Keep page simple, use streaming |
| Mobile layout breaks | Medium | Medium | Test responsive design thoroughly |

## Implementation Readiness

### Prerequisites
- [x] Research complete
- [x] Current implementation analyzed
- [x] Approach options evaluated
- [x] Technical details documented

### Success Criteria
- [ ] Messages only marked read after intentional action or explicit button click
- [ ] Detail view shows full message without accordion
- [ ] Back button returns to list view with correct tab/filter preserved
- [ ] Browser back navigation works correctly
- [ ] Mobile responsive layout maintained

### Next Steps for Planning
1. Create `/dashboard/inquiries/[id]/page.tsx` route
2. Create `InquiryDetailPage` wrapper component
3. Update `InquiryList` to use Link navigation
4. Refactor `InquiryDetail` read-marking logic
5. Add CSS for detail page layout
6. Update tests

## UI Wireframe

### List View (Current location: `/dashboard/inquiries`)
```
┌──────────────────────────────────────────────────────────┐
│ 📬 Inquiries                               [3 unread]    │
├──────────────────────────────────────────────────────────┤
│ [All] [Unread] [Read] [Replied] [Booked] [Archived]      │
├──────────────────────────────────────────────────────────┤
│ ● John Doe  john@example.com  🎨  Flash booking...  2h   │
│ ● Jane Sm   jane@example.com  ✨  Custom request... 1d   │
│   Bob Lee   bob@example.com   💬  Question about... 3d   │
└──────────────────────────────────────────────────────────┘
        ↓ Click message row
```

### Detail View (New location: `/dashboard/inquiries/123`)
```
┌──────────────────────────────────────────────────────────┐
│ ← Back to messages                    [Mark as Read]     │
├──────────────────────────────────────────────────────────┤
│ John Doe                                                 │
│ john@example.com 🎨                           2 hours ago│
├──────────────────────────────────────────────────────────┤
│ MESSAGE                                                  │
│ I'd like to book a flash tattoo appointment...           │
├──────────────────────────────────────────────────────────┤
│ DETAILS                                                  │
│ Type: Flash   Design: #42   Phone: 555-1234              │
│ Status: [✓ Booked] [Archive]                             │
├──────────────────────────────────────────────────────────┤
│ INTERNAL NOTES                                           │
│ ┌─────────────────────────────────────┐                  │
│ │ Add notes...                        │  [Save Notes]    │
│ └─────────────────────────────────────┘                  │
├──────────────────────────────────────────────────────────┤
│ CONVERSATION HISTORY                                     │
│ 📤 You - Deposit Request...              Nov 27, 11:30pm │
│ 📥 Customer - Thanks, I'll send...       Nov 28, 9:15am  │
├──────────────────────────────────────────────────────────┤
│                    [💬 Reply]                            │
└──────────────────────────────────────────────────────────┘
```

## References
- Current InquiryList implementation: `components/admin/InquiryList.tsx`
- Current InquiryDetail implementation: `components/admin/InquiryDetail.tsx`
- Inquiries page: `app/dashboard/inquiries/page.tsx`
- Inquiry inbox plan (archived): `memory-bank/archive/plan-inquiry-inbox-2025-11-26.md`
