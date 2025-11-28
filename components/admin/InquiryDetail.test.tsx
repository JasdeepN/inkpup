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
  saveUnifiedNotesAction: jest.fn(),
  getTemplatesForReplyAction: jest.fn(),
  sendReplyAction: jest.fn(),
  getInquiryAction: jest.fn(),
  getCustomerForInquiryAction: jest.fn(),
  createCustomerFromInquiryAction: jest.fn(),
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
  saveUnifiedNotesAction,
  getTemplatesForReplyAction,
  getInquiryAction,
  getCustomerForInquiryAction,
  createCustomerFromInquiryAction,
} from '../../lib/admin-actions-inquiries';

const mockUpdateStatus = updateInquiryStatusAction as jest.MockedFunction<typeof updateInquiryStatusAction>;
const mockUpdateNotes = updateInquiryNotesAction as jest.MockedFunction<typeof updateInquiryNotesAction>;
const mockSaveUnifiedNotes = saveUnifiedNotesAction as jest.MockedFunction<typeof saveUnifiedNotesAction>;
const mockGetTemplates = getTemplatesForReplyAction as jest.MockedFunction<typeof getTemplatesForReplyAction>;
const mockGetInquiry = getInquiryAction as jest.MockedFunction<typeof getInquiryAction>;
const mockGetCustomer = getCustomerForInquiryAction as jest.MockedFunction<typeof getCustomerForInquiryAction>;
const mockCreateCustomer = createCustomerFromInquiryAction as jest.MockedFunction<typeof createCustomerFromInquiryAction>;

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
    mockSaveUnifiedNotes.mockResolvedValue({ success: 'Notes saved' });
    mockGetCustomer.mockResolvedValue({ customer: null });
    mockCreateCustomer.mockResolvedValue({ customer: null });
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

  it('handles status change to customer_created with customer', async () => {
    // Mock a customer being present to enable status buttons
    mockGetCustomer.mockResolvedValue({ 
      customer: { id: 1, email: 'john@example.com', name: 'John Doe', phone: null, notes: null, total_deposits: 0 } 
    });

    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    const customerCreatedBtn = screen.getByRole('button', { name: /customer created/i });
    await act(async () => {
      fireEvent.click(customerCreatedBtn);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'customer_created');
    });
  });

  it('handles status change to deposit_received after customer_created', async () => {
    // Mock a customer being present and status at customer_created
    mockGetCustomer.mockResolvedValue({ 
      customer: { id: 1, email: 'john@example.com', name: 'John Doe', phone: null, notes: null, total_deposits: 0 } 
    });
    const customerCreatedInquiry = { ...mockInquiry, status: 'customer_created' as const };
    // Also mock the server response to return this status
    mockGetInquiry.mockResolvedValue({ inquiry: customerCreatedInquiry, emails: [] });

    await act(async () => {
      render(<InquiryDetail inquiry={customerCreatedInquiry} />);
    });

    const depositBtn = screen.getByRole('button', { name: /deposit received/i });
    await act(async () => {
      fireEvent.click(depositBtn);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'deposit_received');
    });
  });

  it('shows archive confirmation dialog when Archive is clicked', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    const archiveBtn = screen.getByRole('button', { name: /^archive$/i });
    await act(async () => {
      fireEvent.click(archiveBtn);
    });

    // Dialog should appear (uses alertdialog role)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to archive this inquiry/i)).toBeInTheDocument();
  });

  it('archives inquiry when confirmation dialog is confirmed', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    // Click Archive button
    const archiveBtn = screen.getByRole('button', { name: /^archive$/i });
    await act(async () => {
      fireEvent.click(archiveBtn);
    });

    // Dialog should appear (alertdialog), click confirm button
    const dialog = screen.getByRole('alertdialog');
    // Get the second "Archive" button (the confirm button in the dialog)
    const buttons = dialog.querySelectorAll('button');
    const confirmBtn = buttons[1]; // Second button is confirm
    expect(confirmBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, 'archived');
    });
  });

  it('does not archive when confirmation dialog is cancelled', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    // Click Archive button
    const archiveBtn = screen.getByRole('button', { name: /^archive$/i });
    await act(async () => {
      fireEvent.click(archiveBtn);
    });

    // Dialog should appear (alertdialog), click cancel
    const dialog = screen.getByRole('alertdialog');
    const cancelBtn = dialog.querySelector('button'); // First button is cancel
    expect(cancelBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(cancelBtn!);
    });

    // Dialog should close, no status update
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(mockUpdateStatus).not.toHaveBeenCalled();
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
      expect(mockSaveUnifiedNotes).toHaveBeenCalledWith(1, 'Updated notes');
    });
  });

  it('Save Notes button has specific styling class', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    const saveBtn = screen.getByRole('button', { name: /save notes/i });
    expect(saveBtn).toHaveClass('inquiry-detail__save-notes');
  });

  it('shows reply form when Reply button is clicked', async () => {
    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} />);
    });

    const replyBtn = screen.getByRole('button', { name: /reply/i });
    fireEvent.click(replyBtn);

    expect(screen.getByTestId('reply-form')).toBeInTheDocument();
  });

  it('calls onActionTaken callback on status change', async () => {
    const mockOnActionTaken = jest.fn().mockResolvedValue(undefined);
    // Mock a customer being present to enable status buttons
    mockGetCustomer.mockResolvedValue({ 
      customer: { id: 1, email: 'john@example.com', name: 'John Doe', phone: null, notes: null, total_deposits: 0 } 
    });

    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} onActionTaken={mockOnActionTaken} />);
    });

    // With a customer, "Customer Created" button should be clickable
    const customerCreatedBtn = screen.getByRole('button', { name: /customer created/i });
    await act(async () => {
      fireEvent.click(customerCreatedBtn);
    });

    await waitFor(() => {
      expect(mockOnActionTaken).toHaveBeenCalled();
    });
  });

  it('calls onActionTaken callback on save notes', async () => {
    const mockOnActionTaken = jest.fn().mockResolvedValue(undefined);

    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} onActionTaken={mockOnActionTaken} />);
    });

    const notesTextarea = screen.getByPlaceholderText(/add private notes/i);
    fireEvent.change(notesTextarea, { target: { value: 'New notes' } });

    const saveBtn = screen.getByRole('button', { name: /save notes/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(mockOnActionTaken).toHaveBeenCalled();
    });
  });

  it('calls onStatusChange callback when status updates', async () => {
    const mockOnStatusChange = jest.fn();
    // Mock a customer being present so the status buttons are enabled
    mockGetCustomer.mockResolvedValue({ 
      customer: { id: 1, email: 'john@example.com', name: 'John Doe', phone: null, notes: null, total_deposits: 0 } 
    });

    await act(async () => {
      render(<InquiryDetail inquiry={mockInquiry} onStatusChange={mockOnStatusChange} />);
    });

    // With a customer, "Customer Created" button should be clickable
    const customerCreatedBtn = screen.getByRole('button', { name: /customer created/i });
    await act(async () => {
      fireEvent.click(customerCreatedBtn);
    });

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith('customer_created');
    });
  });
});
