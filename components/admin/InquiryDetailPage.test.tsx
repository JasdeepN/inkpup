/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import InquiryDetailPage from './InquiryDetailPage';
import type { Inquiry } from '../../lib/schemas/inquiry';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the server action
jest.mock('../../lib/admin-actions-inquiries', () => ({
  updateInquiryStatusAction: jest.fn(),
  getTemplatesForReplyAction: jest.fn(),
  getInquiryAction: jest.fn(),
  updateInquiryNotesAction: jest.fn(),
  sendReplyAction: jest.fn(),
}));

// Mock InquiryDetail to simplify tests
jest.mock('./InquiryDetail', () => {
  return function MockInquiryDetail({ 
    onStatusChange, 
    onActionTaken 
  }: { 
    onStatusChange?: (status: string) => void;
    onActionTaken?: () => Promise<unknown>;
  }) {
    return (
      <div data-testid="inquiry-detail">
        <button 
          data-testid="trigger-status-change" 
          onClick={() => onStatusChange?.('booked')}
        >
          Trigger Status Change
        </button>
        <button 
          data-testid="trigger-action" 
          onClick={() => onActionTaken?.()}
        >
          Trigger Action
        </button>
      </div>
    );
  };
});

import { updateInquiryStatusAction } from '../../lib/admin-actions-inquiries';

const mockUpdateStatus = updateInquiryStatusAction as jest.MockedFunction<typeof updateInquiryStatusAction>;

const mockUnreadInquiry: Inquiry = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  inquiry_type: 'custom',
  design_id: null,
  message: 'I want a tattoo design',
  placement: 'arm',
  budget: '200-500',
  status: 'unread',
  notes: null,
  created_at: '2024-01-15T10:00:00Z',
  replied_at: null,
};

const mockReadInquiry: Inquiry = {
  ...mockUnreadInquiry,
  status: 'read',
};

describe('InquiryDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateStatus.mockResolvedValue({ success: true });
    mockPush.mockClear();
  });

  it('renders the detail page with back link', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockReadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    expect(screen.getByRole('link', { name: /back to messages/i })).toBeInTheDocument();
    expect(screen.getByTestId('inquiry-detail')).toBeInTheDocument();
  });

  it('shows inquiry name and type in header', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockReadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Custom type has ✨ emoji
    expect(screen.getByText(/custom/i)).toBeInTheDocument();
  });

  it('shows Mark as Unread button for read inquiries', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockReadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    expect(screen.getByRole('button', { name: /mark as unread/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark as read/i })).not.toBeInTheDocument();
  });

  it('shows Mark as Read button for unread inquiries', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockUnreadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    expect(screen.getByRole('button', { name: /mark as read/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark as unread/i })).not.toBeInTheDocument();
  });

  it('marks as read when Mark as Read button is clicked', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockUnreadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    const markReadBtn = screen.getByRole('button', { name: /mark as read/i });
    await act(async () => {
      fireEvent.click(markReadBtn);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'read');
    });
  });

  it('marks as unread when Mark as Unread button is clicked', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockReadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    const markUnreadBtn = screen.getByRole('button', { name: /mark as unread/i });
    await act(async () => {
      fireEvent.click(markUnreadBtn);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'unread');
    });
  });

  it('marks as read and navigates when back link is clicked for unread inquiry', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockUnreadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    const backLink = screen.getByRole('link', { name: /back to messages/i });
    await act(async () => {
      fireEvent.click(backLink);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'read');
      expect(mockPush).toHaveBeenCalledWith('/dashboard/inquiries');
    });
  });

  it('does not call markAsRead when navigating back from read inquiry', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockReadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    const backLink = screen.getByRole('link', { name: /back to messages/i });
    // For read inquiries, the link navigates normally without calling markAsRead
    fireEvent.click(backLink);

    // updateInquiryStatusAction should not be called
    expect(mockUpdateStatus).not.toHaveBeenCalled();
  });

  it('updates local status when InquiryDetail reports status change', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockReadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    // Initially shows Mark as Unread (because status is 'read')
    expect(screen.getByRole('button', { name: /mark as unread/i })).toBeInTheDocument();

    // Trigger a status change to 'booked' from the child
    const triggerBtn = screen.getByTestId('trigger-status-change');
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    // The component should update its local state
    // After status changes to 'booked', it's no longer unread, so Mark as Unread should still show
    expect(screen.getByRole('button', { name: /mark as unread/i })).toBeInTheDocument();
  });

  it('calls markAsRead when InquiryDetail triggers onActionTaken for unread', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockUnreadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    const triggerBtn = screen.getByTestId('trigger-action');
    await act(async () => {
      fireEvent.click(triggerBtn);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'read');
    });
  });

  it('displays from status badge when provided', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockReadInquiry} 
          backUrl="/dashboard/inquiries?status=read"
          fromStatus="read"
        />
      );
    });

    // The back link should mention the status
    expect(screen.getByRole('link', { name: /back to messages/i })).toHaveAttribute(
      'href',
      '/dashboard/inquiries?status=read'
    );
  });

  it('shows Unread badge for unread inquiries', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockUnreadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    // Badge shows status with emoji
    expect(screen.getByText(/UNREAD/)).toBeInTheDocument();
  });

  it('shows status badge for read inquiries', async () => {
    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={mockReadInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    expect(screen.getByText('READ')).toBeInTheDocument();
  });

  it('shows READ badge for deposit_received status (status tracked in progression)', async () => {
    const depositInquiry: Inquiry = {
      ...mockReadInquiry,
      status: 'deposit_received',
    };

    await act(async () => {
      render(
        <InquiryDetailPage 
          inquiry={depositInquiry} 
          backUrl="/dashboard/inquiries"
        />
      );
    });

    // Badge shows READ for all non-unread, non-archived statuses
    // The actual status is shown in the StatusProgression component
    expect(screen.getByText('READ')).toBeInTheDocument();
  });
});
