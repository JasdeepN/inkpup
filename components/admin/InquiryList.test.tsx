import React from 'react';
import { render, screen } from '@testing-library/react';
import InquiryList from './InquiryList';
import type { Inquiry } from '@/lib/schemas/inquiry';

// Mock useSearchParams as a jest.fn so we can change its return value
const mockUseSearchParams = jest.fn(() => new URLSearchParams(''));

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

const mockInquiries: Inquiry[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-1234',
    inquiry_type: 'flash',
    design_id: 'wolf-01',
    message: 'I want the wolf design',
    placement: 'forearm',
    budget: '$300-500',
    status: 'unread',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    replied_at: null,
    notes: null,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: null,
    inquiry_type: 'custom',
    design_id: null,
    message: 'I have a custom idea',
    placement: 'shoulder',
    budget: null,
    status: 'replied',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    replied_at: new Date().toISOString(),
    notes: 'Good client',
  },
  {
    id: 3,
    name: 'Bob Wilson',
    email: 'bob@example.com',
    phone: null,
    inquiry_type: 'contact',
    design_id: null,
    message: 'General question',
    placement: null,
    budget: null,
    status: 'read',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    replied_at: null,
    notes: null,
  },
  {
    id: 4,
    name: 'Alice Green',
    email: 'alice@example.com',
    phone: null,
    inquiry_type: 'flash',
    design_id: null,
    message: 'Deposit paid',
    placement: null,
    budget: null,
    status: 'deposit_received',
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    replied_at: null,
    notes: null,
  },
];

describe('InquiryList', () => {
  it('renders empty state when no inquiries', () => {
    render(<InquiryList inquiries={[]} />);
    
    expect(screen.getByText(/no inquiries yet/i)).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders all inquiries as links', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    
    // Check that items are links
    const johnLink = screen.getByText('John Doe').closest('a');
    expect(johnLink).toHaveAttribute('href', '/dashboard/inquiries/1');
  });

  it('shows unread indicator for unread inquiries', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    // John's inquiry is unread and should have the unread class
    const johnItem = screen.getByText('John Doe').closest('.inquiry-item');
    expect(johnItem).toHaveClass('inquiry-item--unread');
    
    // Jane's inquiry is replied and should NOT have the unread class
    const janeItem = screen.getByText('Jane Smith').closest('.inquiry-item');
    expect(janeItem).not.toHaveClass('inquiry-item--unread');
  });

  it('links to detail page with correct URL', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    const johnLink = screen.getByText('John Doe').closest('a');
    expect(johnLink).toHaveAttribute('href', '/dashboard/inquiries/1');
    
    const janeLink = screen.getByText('Jane Smith').closest('a');
    expect(janeLink).toHaveAttribute('href', '/dashboard/inquiries/2');
  });

  it('displays inquiry type emoji', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    // Flash type should show art emoji
    expect(screen.getAllByText('🎨')).toHaveLength(2); // John and Alice
    // Custom type should show sparkle emoji
    expect(screen.getByText('✨')).toBeInTheDocument();
    // Contact type should show chat emoji
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('displays email addresses', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('displays status badges including deposit_received', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText('Awaiting')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('💰 Deposit')).toBeInTheDocument();
  });

  it('shows arrow indicator for navigation', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    const arrows = screen.getAllByText('→');
    expect(arrows.length).toBe(mockInquiries.length);
  });
});

describe('InquiryList with status filter', () => {
  beforeEach(() => {
    // Mock with status param
    mockUseSearchParams.mockReturnValue(new URLSearchParams('status=unread'));
  });

  afterEach(() => {
    // Reset to default
    mockUseSearchParams.mockReturnValue(new URLSearchParams(''));
  });

  it('passes from param in link when status filter is active', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    const johnLink = screen.getByText('John Doe').closest('a');
    expect(johnLink).toHaveAttribute('href', '/dashboard/inquiries/1?from=unread');
  });
});
