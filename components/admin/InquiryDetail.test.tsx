/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import InquiryDetail from './InquiryDetail';
import type { Inquiry, EmailTemplate } from '../../lib/schemas/inquiry';

// Mock the server actions
jest.mock('../../lib/admin-actions-inquiries', () => ({
  updateInquiryStatusAction: jest.fn(),
  updateInquiryNotesAction: jest.fn(),
  getTemplatesForReplyAction: jest.fn(),
  sendReplyAction: jest.fn(),
  getInquiryAction: jest.fn(),
}));

// Mock InquiryReplyForm
jest.mock('./InquiryReplyForm', () => {
  return function MockReplyForm({ onCancel }: { onCancel: () => void }) {
    return (
      <div data-testid="reply-form">
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

import {
  updateInquiryStatusAction,
  updateInquiryNotesAction,
  getTemplatesForReplyAction,
  getInquiryAction,
} from '../../lib/admin-actions-inquiries';

const mockUpdateStatus = updateInquiryStatusAction as jest.MockedFunction<typeof updateInquiryStatusAction>;
const mockUpdateNotes = updateInquiryNotesAction as jest.MockedFunction<typeof updateInquiryNotesAction>;
const mockGetTemplates = getTemplatesForReplyAction as jest.MockedFunction<typeof getTemplatesForReplyAction>;
const mockGetInquiry = getInquiryAction as jest.MockedFunction<typeof getInquiryAction>;

const mockInquiry: Inquiry = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  inquiry_type: 'custom',
  design_id: null,
  message: 'I want a tattoo design',
  placement: 'arm',
  budget: '200-500',
  status: 'read',
  notes: 'Good client',
  created_at: '2024-01-15T10:00:00Z',
  replied_at: '2024-01-16T14:00:00Z',
};

describe('InquiryDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTemplates.mockResolvedValue([]);
    mockGetInquiry.mockResolvedValue({ inquiry: mockInquiry, emails: [] });
    mockUpdateStatus.mockResolvedValue({ success: true });
    mockUpdateNotes.mockResolvedValue({ success: true });
  });

  it('renders inquiry details', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    expect(screen.getByText('I want a tattoo design')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
    expect(screen.getByText('arm')).toBeInTheDocument();
    expect(screen.getByText('200-500')).toBeInTheDocument();
  });

  it('displays message when no message provided', async () => {
    const noMessageInquiry = { ...mockInquiry, message: null };
    await act(async () => {
      render(<InquiryDetail inquiry={noMessageInquiry} />);
    });

    expect(screen.getByText('No message provided')).toBeInTheDocument();
  });

  it('loads templates on mount', async () => {
    const mockTemplates: EmailTemplate[] = [
      { id: 1, slug: 'welcome', name: 'Welcome', subject: 'Hi', body: 'Hello', is_default: 1, created_at: '', updated_at: '' },
    ];
    mockGetTemplates.mockResolvedValue(mockTemplates);

    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    expect(mockGetTemplates).toHaveBeenCalled();
  });

  it('handles status change to booked', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    const bookedBtn = screen.getByRole('button', { name: /booked/i });
    await act(async () => {
      fireEvent.click(bookedBtn);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'booked');
    });
  });

  it('handles status change to archived', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    const archiveBtn = screen.getByRole('button', { name: /archive/i });
    await act(async () => {
      fireEvent.click(archiveBtn);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'archived');
    });
  });

  it('saves notes when Save Notes button is clicked', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    const notesTextarea = screen.getByPlaceholderText(/add private notes/i);
    fireEvent.change(notesTextarea, { target: { value: 'Updated notes' } });

    const saveBtn = screen.getByRole('button', { name: /save notes/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(mockUpdateNotes).toHaveBeenCalledWith(1, 'Updated notes');
    });
  });

  it('shows reply form when Reply button is clicked', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    const replyBtn = screen.getByRole('button', { name: /reply/i });
    fireEvent.click(replyBtn);

    expect(screen.getByTestId('reply-form')).toBeInTheDocument();
  });
});
