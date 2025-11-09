import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  test('renders title, value, and description', () => {
    render(<StatCard title="Total Requests" value="12,345" description="Last 24 hours" />);
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(screen.getByText('12,345')).toBeInTheDocument();
    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
  });

  test('renders loading skeleton', () => {
    const { container } = render(<StatCard title="Total Requests" loading />);
    expect(screen.getByText('Total Requests')).toBeInTheDocument();
    expect(container.querySelector('.admin-stat-card__skeleton')).toBeTruthy();
  });

  test('renders error state', () => {
    render(<StatCard title="Total Requests" error="Analytics unavailable" />);
    expect(screen.getByText('Analytics unavailable')).toBeInTheDocument();
  });

  test('formats delta and renders trend sparkline', () => {
    render(
      <StatCard
        title="Cache Hit Rate"
        value="88%"
        delta={{ value: 0.05, format: 'percent' }}
        trend={[0.2, 0.4, 0.6, 0.7, 0.8]}
      />,
    );

    expect(screen.getByText('+5%')).toBeInTheDocument();
    const sparkline = document.querySelector('svg.admin-sparkline');
    expect(sparkline).toBeTruthy();
  });
});
