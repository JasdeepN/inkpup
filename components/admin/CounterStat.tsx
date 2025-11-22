'use client';

import { useCountUp, COUNT_DURATIONS, type UseCountUpOptions } from '../../lib/animations/useCountUp';

interface CounterStatProps {
  /**
   * The target number to count up to
   */
  value: number;
  
  /**
   * Label for the statistic
   */
  label: string;
  
  /**
   * Optional prefix (e.g., "$")
   */
  prefix?: string;
  
  /**
   * Optional suffix (e.g., "%", "K", "M", "+")
   */
  suffix?: string;
  
  /**
   * Number of decimal places (default: 0)
   */
  decimals?: number;
  
  /**
   * Animation duration (default: COUNT_DURATIONS.NORMAL)
   */
  duration?: UseCountUpOptions['duration'];
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Animated counter statistic component
 * Displays a number that counts up from 0 when scrolled into view
 * 
 * @example
 * ```tsx
 * <CounterStat value={1234} label="Total Views" suffix=" views" />
 * <CounterStat value={95.8} label="Success Rate" decimals={1} suffix="%" />
 * <CounterStat value={1500} label="Revenue" prefix="$" />
 * ```
 */
export default function CounterStat({
  value,
  label,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = COUNT_DURATIONS.NORMAL,
  className = '',
}: CounterStatProps) {
  const { displayValue, ref } = useCountUp({
    end: value,
    start: 0,
    duration,
    decimals,
    prefix,
    suffix,
    threshold: 0.25, // Start animating when 25% visible
  });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`counter-stat ${className}`.trim()}>
      <div className="counter-stat__value" aria-live="polite">
        {displayValue}
      </div>
      <div className="counter-stat__label">{label}</div>
    </div>
  );
}
