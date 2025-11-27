import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InquiryList from './InquiryList';
import type { Inquiry } from '@/lib/schemas/inquiry';

// Mock InquiryDetail to simplify testing
jest.mock('./InquiryDetail', () => ({
  __esModule: true,
  default: ({ inquiry }: { inquiry: Inquiry }) => (
    <div data-testid={`detail-${inquiry.id}`}>
      Detail for {inquiry.name}
    </div>
  ),
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
];

describe('InquiryList', () => {
  it('renders empty state when no inquiries', () => {
    render(<InquiryList inquiries={[]} />);
    
    expect(screen.getByText(/no inquiries yet/i)).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders all inquiries', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
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

  it('expands inquiry detail when clicked', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    // Detail should not be visible initially
    expect(screen.queryByTestId('detail-1')).not.toBeInTheDocument();
    
    // Click to expand
    const johnHeader = screen.getByText('John Doe').closest('button');
    fireEvent.click(johnHeader!);
    
    // Detail should now be visible
    expect(screen.getByTestId('detail-1')).toBeInTheDocument();
  });

  it('collapses inquiry detail when clicked again', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    const johnHeader = screen.getByText('John Doe').closest('button');
    
    // Expand
    fireEvent.click(johnHeader!);
    expect(screen.getByTestId('detail-1')).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(johnHeader!);
    expect(screen.queryByTestId('detail-1')).not.toBeInTheDocument();
  });

  it('only expands one inquiry at a time', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    // Expand John's
    fireEvent.click(screen.getByText('John Doe').closest('button')!);
    expect(screen.getByTestId('detail-1')).toBeInTheDocument();
    
    // Expand Jane's (should collapse John's)
    fireEvent.click(screen.getByText('Jane Smith').closest('button')!);
    expect(screen.queryByTestId('detail-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('detail-2')).toBeInTheDocument();
  });

  it('displays inquiry type emoji', () => {
    render(<InquiryList inquiries={mockInquiries} />);
    
    // Flash type should show art emoji
    expect(screen.getByText('🎨')).toBeInTheDocument();
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
});
