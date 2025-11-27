'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface DashboardStatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  href: string;
  linkText: string;
  highlight?: boolean;
}

/**
 * Simple stat card for the admin dashboard
 * Shows an icon, title, value, and a link to the detail page
 */
export default function DashboardStatCard({
  icon,
  title,
  value,
  subtitle,
  href,
  linkText,
  highlight = false,
}: DashboardStatCardProps) {
  return (
    <article className={`admin-card admin-dashboard__stat-card ${highlight ? 'admin-dashboard__stat-card--highlight' : ''}`}>
      <div className="admin-dashboard__stat-card-icon">{icon}</div>
      <div className="admin-dashboard__stat-card-content">
        <h3 className="admin-dashboard__stat-card-title">{title}</h3>
        <p className="admin-dashboard__stat-card-value">{value}</p>
        {subtitle && <p className="admin-dashboard__stat-card-subtitle">{subtitle}</p>}
      </div>
      <Link href={href} className="admin-dashboard__stat-card-link">
        {linkText} →
      </Link>
    </article>
  );
}
