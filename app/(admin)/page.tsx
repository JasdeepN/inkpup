import { notFound } from 'next/navigation';

// This route group is reserved; all admin traffic is handled by `app/(admin)/admin/page.tsx`.
// Avoid duplicate routing and dynamic API usage here.
export default function AdminGroupIndex() {
  notFound();
}
