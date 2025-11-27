/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TemplateEditor from './TemplateEditor';
import type { EmailTemplate } from '../../lib/schemas/inquiry';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock the server actions
jest.mock('../../lib/admin-actions-templates', () => ({
  createTemplateAction: jest.fn(),
  updateTemplateDirectAction: jest.fn(),
}));

import { createTemplateAction, updateTemplateDirectAction } from '../../lib/admin-actions-templates';

const mockCreateTemplate = createTemplateAction as jest.MockedFunction<typeof createTemplateAction>;
const mockUpdateTemplate = updateTemplateDirectAction as jest.MockedFunction<typeof updateTemplateDirectAction>;

const mockTemplate: EmailTemplate = {
  id: 1,
  slug: 'test_template',
  name: 'Test Template',
  subject: 'Hello {{name}}',
  body: 'Dear {{name}}, thank you for your inquiry!',
  is_default: 0,
  created_at: '2024-01-01',
  updated_at: '2024-01-02',
};

describe('TemplateEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTemplate.mockResolvedValue({ success: true });
    mockUpdateTemplate.mockResolvedValue({ success: true });
  });

  describe('Create mode', () => {
    it('renders create form with slug field', () => {
      render(<TemplateEditor mode="create" />);

      expect(screen.getByRole('heading', { name: 'Create Template' })).toBeInTheDocument();
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    it('formats slug to lowercase with underscores', () => {
      render(<TemplateEditor mode="create" />);

      const slugInput = screen.getByLabelText(/slug/i);
      fireEvent.change(slugInput, { target: { value: 'My Test Slug!' } });

      expect(slugInput).toHaveValue('my_test_slug_');
    });
  });

  describe('Edit mode', () => {
    it('renders edit form with template data', () => {
      render(<TemplateEditor mode="edit" template={mockTemplate} />);

      expect(screen.getByText(/edit: test template/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toHaveValue('Test Template');
    });

    it('does not show slug field in edit mode', () => {
      render(<TemplateEditor mode="edit" template={mockTemplate} />);

      expect(screen.queryByLabelText(/slug/i)).not.toBeInTheDocument();
    });

    it('submits update with correct data', async () => {
      render(<TemplateEditor mode="edit" template={mockTemplate} />);

      fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Updated Name' } });

      const submitBtn = screen.getByRole('button', { name: /save changes/i });
      
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith(1, expect.objectContaining({
          name: 'Updated Name',
        }));
      });
    });
  });

  describe('Preview functionality', () => {
    it('shows preview toggle', () => {
      render(<TemplateEditor mode="create" />);

      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    });
  });

  describe('Back navigation', () => {
    it('has back link to templates list', () => {
      render(<TemplateEditor mode="create" />);

      const backLink = screen.getByRole('link', { name: /back/i });
      expect(backLink).toHaveAttribute('href', '/dashboard/templates');
    });
  });
});
