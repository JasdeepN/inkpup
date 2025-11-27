/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InquiryReplyForm from './InquiryReplyForm';
import type { Inquiry, EmailTemplate } from '../../lib/schemas/inquiry';

// Mock the server action
jest.mock('../../lib/admin-actions-inquiries', () => ({
  sendReplyAction: jest.fn(),
}));

import { sendReplyAction } from '../../lib/admin-actions-inquiries';

const mockSendReply = sendReplyAction as jest.MockedFunction<typeof sendReplyAction>;

const mockInquiry: Inquiry = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  inquiry_type: 'custom',
  design_id: null,
  message: 'I want a tattoo',
  placement: 'arm',
  budget: '200-500',
  status: 'read',
  notes: null,
  created_at: '2024-01-15T10:00:00Z',
  replied_at: null,
};

const mockTemplates: EmailTemplate[] = [
  {
    id: 1,
    slug: 'thanks',
    name: 'Thank You',
    subject: 'Thanks for your inquiry',
    body: 'Hi {{name}}, thanks for reaching out!',
    is_default: 1,
    created_at: '',
    updated_at: '',
  },
  {
    id: 2,
    slug: 'booking',
    name: 'Booking Confirmation',
    subject: 'Your appointment with {{name}}',
    body: 'Hi {{name}}, your appointment is confirmed for {{date}} at {{time}}. Deposit: ${{amount}}.',
    is_default: 0,
    created_at: '',
    updated_at: '',
  },
];

describe('InquiryReplyForm', () => {
  const mockOnCancel = jest.fn();
  const mockOnSent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendReply.mockResolvedValue({ success: true });
  });

  it('renders the form with recipient name', () => {
    render(
      <InquiryReplyForm
        inquiry={mockInquiry}
        templates={mockTemplates}
        onCancel={mockOnCancel}
        onSent={mockOnSent}
      />
    );

    expect(screen.getByText(/send reply to john doe/i)).toBeInTheDocument();
  });

  it('renders template selector with options', () => {
    render(
      <InquiryReplyForm
        inquiry={mockInquiry}
        templates={mockTemplates}
        onCancel={mockOnCancel}
        onSent={mockOnSent}
      />
    );

    expect(screen.getByLabelText(/template/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /custom message/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /thank you/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /booking confirmation/i })).toBeInTheDocument();
  });

  it('fills subject and body when template is selected', () => {
    render(
      <InquiryReplyForm
        inquiry={mockInquiry}
        templates={mockTemplates}
        onCancel={mockOnCancel}
        onSent={mockOnSent}
      />
    );

    const templateSelect = screen.getByLabelText(/template/i);
    fireEvent.change(templateSelect, { target: { value: '1' } });

    expect(screen.getByLabelText(/subject/i)).toHaveValue('Thanks for your inquiry');
    expect(screen.getByLabelText(/message/i)).toHaveValue('Hi {{name}}, thanks for reaching out!');
  });

  it('clears subject and body when Custom Message is selected', () => {
    render(
      <InquiryReplyForm
        inquiry={mockInquiry}
        templates={mockTemplates}
        onCancel={mockOnCancel}
        onSent={mockOnSent}
      />
    );

    // First select a template
    const templateSelect = screen.getByLabelText(/template/i);
    fireEvent.change(templateSelect, { target: { value: '1' } });
    
    // Then select custom message
    fireEvent.change(templateSelect, { target: { value: '' } });

    expect(screen.getByLabelText(/subject/i)).toHaveValue('');
    expect(screen.getByLabelText(/message/i)).toHaveValue('');
  });

  it('shows custom variable inputs for templates that need them', () => {
    render(
      <InquiryReplyForm
        inquiry={mockInquiry}
        templates={mockTemplates}
        onCancel={mockOnCancel}
        onSent={mockOnSent}
      />
    );

    // Select booking template which has {{date}}, {{time}}, {{amount}}
    const templateSelect = screen.getByLabelText(/template/i);
    fireEvent.change(templateSelect, { target: { value: '2' } });

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(
      <InquiryReplyForm
        inquiry={mockInquiry}
        templates={mockTemplates}
        onCancel={mockOnCancel}
        onSent={mockOnSent}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('sends reply with correct data', async () => {
    render(
      <InquiryReplyForm
        inquiry={mockInquiry}
        templates={mockTemplates}
        onCancel={mockOnCancel}
        onSent={mockOnSent}
      />
    );

    // Fill in subject and body
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Test body content' } });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockSendReply).toHaveBeenCalledWith(
        1, // inquiry id
        null, // no template selected
        'Test Subject',
        'Test body content',
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(mockOnSent).toHaveBeenCalled();
    });
  });

  it('displays error when send fails', async () => {
    mockSendReply.mockResolvedValue({ error: 'Failed to send email' });

    render(
      <InquiryReplyForm
        inquiry={mockInquiry}
        templates={mockTemplates}
        onCancel={mockOnCancel}
        onSent={mockOnSent}
      />
    );

    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Test' } });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to send email')).toBeInTheDocument();
    });

    expect(mockOnSent).not.toHaveBeenCalled();
  });
});
