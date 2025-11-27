import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardStatCard from './DashboardStatCard';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="stat-link">{children}</a>
  ),
}));

describe('DashboardStatCard', () => {
  const defaultProps = {
    icon: <span data-testid="test-icon">🎨</span>,
    title: 'Flash Designs',
    value: 12,
    subtitle: 'ready to book',
    href: '/gallery?category=flash',
    linkText: 'Manage',
  };

  it('renders icon', () => {
    render(<DashboardStatCard {...defaultProps} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<DashboardStatCard {...defaultProps} />);
    expect(screen.getByText('Flash Designs')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<DashboardStatCard {...defaultProps} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<DashboardStatCard {...defaultProps} value="—" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<DashboardStatCard {...defaultProps} />);
    expect(screen.getByText('ready to book')).toBeInTheDocument();
  });

  it('renders without subtitle when not provided', () => {
    render(<DashboardStatCard {...defaultProps} subtitle={undefined} />);
    expect(screen.queryByText('ready to book')).not.toBeInTheDocument();
  });

  it('renders link with correct href', () => {
    render(<DashboardStatCard {...defaultProps} />);
    const link = screen.getByTestId('stat-link');
    expect(link).toHaveAttribute('href', '/gallery?category=flash');
  });

  it('renders link text with arrow', () => {
    render(<DashboardStatCard {...defaultProps} />);
    expect(screen.getByText(/Manage →/)).toBeInTheDocument();
  });

  it('applies highlight class when highlight is true', () => {
    const { container } = render(<DashboardStatCard {...defaultProps} highlight={true} />);
    const card = container.querySelector('.admin-dashboard__stat-card');
    expect(card).toHaveClass('admin-dashboard__stat-card--highlight');
  });

  it('does not apply highlight class by default', () => {
    const { container } = render(<DashboardStatCard {...defaultProps} />);
    const card = container.querySelector('.admin-dashboard__stat-card');
    expect(card).not.toHaveClass('admin-dashboard__stat-card--highlight');
  });

  it('has proper semantic structure', () => {
    render(<DashboardStatCard {...defaultProps} />);
    
    // Should be an article element
    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    
    // Title should be in a heading
    const heading = screen.getByRole('heading', { name: 'Flash Designs' });
    expect(heading).toBeInTheDocument();
  });
});
