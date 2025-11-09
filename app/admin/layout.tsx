import type { ReactNode } from 'react';

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-10">
      {children}
    </div>
  );
}
