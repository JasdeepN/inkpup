import React from 'react';
import TrendSparkline from './TrendSparkline';

export type StatDeltaDirection = 'up' | 'down' | 'neutral';

export interface StatDelta {
  value: number;
  direction?: StatDeltaDirection;
  label?: string;
  format?: 'percent' | 'number';
}

export interface StatCardProps {
  title: string;
  value?: string | number;
  description?: string;
  delta?: StatDelta;
  trend?: number[];
  trendLabel?: string;
  loading?: boolean;
  error?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

function resolveDeltaDirection(delta: StatDelta | undefined): StatDeltaDirection {
  if (!delta) return 'neutral';
  if (delta.direction) return delta.direction;
  if (delta.value > 0) return 'up';
  if (delta.value < 0) return 'down';
  return 'neutral';
}

function formatDeltaValue(delta: StatDelta | undefined): string | null {
  if (!delta) return null;
  const formatter = delta.format === 'percent'
    ? new Intl.NumberFormat(undefined, { style: 'percent', signDisplay: 'always', maximumFractionDigits: 1 })
    : new Intl.NumberFormat(undefined, { signDisplay: 'always', maximumFractionDigits: 1 });
  return formatter.format(delta.format === 'percent' ? delta.value : delta.value);
}

function StatCard({
  title,
  value,
  description,
  delta,
  trend,
  trendLabel,
  loading = false,
  error,
  icon,
  children,
}: StatCardProps) {
  const resolvedDirection = resolveDeltaDirection(delta);
  const formattedDelta = formatDeltaValue(delta);

  return (
    <div className="admin-card admin-card--compact admin-stat-card" aria-live="polite">
      <div className="admin-stat-card__header">
        <div className="admin-stat-card__title">
          {icon && <span className="admin-stat-card__icon" aria-hidden="true">{icon}</span>}
          <h3>{title}</h3>
        </div>
        {delta && formattedDelta && (
          <div className={`admin-stat-card__delta admin-stat-card__delta--${resolvedDirection}`}>
            <span className="admin-stat-card__delta-value">{formattedDelta}</span>
            {delta.label && <span className="admin-stat-card__delta-label">{delta.label}</span>}
          </div>
        )}
      </div>

      <div className="admin-stat-card__body">
        {loading ? (
          <div className="admin-stat-card__skeleton" aria-hidden="true" />
        ) : error ? (
          <p className="admin-stat-card__error">{error}</p>
        ) : (
          <div>
            <p className="admin-stat-card__value">{value ?? '—'}</p>
            {description && <p className="admin-stat-card__description text-muted">{description}</p>}
          </div>
        )}

        {trend && trend.length > 1 && !loading && !error && (
          <div className="admin-stat-card__trend">
            <span className="sr-only">{trendLabel ?? `${title} trend`}</span>
            <TrendSparkline values={trend} />
          </div>
        )}
      </div>

      {children && <div className="admin-stat-card__footer">{children}</div>}
    </div>
  );
}

export default StatCard;
