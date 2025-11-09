import React, { useMemo } from 'react';

export interface TrendSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  gradientId?: string;
  className?: string;
}

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 36;

function normalizeValues(values: number[]) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) {
    return {
      points: [],
      min: 0,
      max: 0,
    };
  }

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = max - min || 1;

  const points = values.map((value, index) => ({
    x: index / Math.max(values.length - 1, 1),
    y: Number.isFinite(value) ? (value - min) / range : 0,
  }));

  return { points, min, max };
}

const TrendSparkline: React.FC<TrendSparklineProps> = ({
  values,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  stroke = 'var(--admin-accent, #38bdf8)',
  strokeWidth = 2,
  gradientId = 'statcard-sparkline-gradient',
  className,
}) => {
  const { points } = useMemo(() => normalizeValues(values), [values]);

  if (points.length < 2) {
    return null;
  }

  const pathData = points
    .map((point, index) => {
      const x = Math.round(point.x * width * 100) / 100;
      const y = Math.round((1 - point.y) * height * 100) / 100;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  const areaPath = `${pathData} L${width},${height} L0,${height} Z`;

  return (
    <svg
      className={className ? `admin-sparkline ${className}` : 'admin-sparkline'}
      viewBox={`0 0 ${width} ${height}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} opacity={0.3} />
      <path d={pathData} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default TrendSparkline;
