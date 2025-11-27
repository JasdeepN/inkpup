/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplateList from './TemplateList';
import type { EmailTemplate } from '../../lib/schemas/inquiry';

// Mock Next.js navigation
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock the server action
jest.mock('../../lib/admin-actions-templates', () => ({
  deleteTemplateAction: jest.fn(),
}));

import { deleteTemplateAction } from '../../lib/admin-actions-templates';

const mockDeleteTemplate = deleteTemplateAction as jest.MockedFunction<typeof deleteTemplateAction>;

const mockTemplates: EmailTemplate[] = [
  {
    id: 1,
    slug: 'default_reply',
    name: 'Default Reply',
    subject: 'Thanks for contacting us',
    body: 'Hi {{name}}, thanks for reaching out!',
    is_default: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-02',
  },
  {
    id: 2,
    slug: 'custom_greeting',
    name: 'Custom Greeting',
    subject: 'Hello {{name}}!',
    body: 'Dear {{name}}, welcome!',
    is_default: 0,
    created_at: '2024-01-05',
    updated_at: '2024-01-05',
  },
];

describe('TemplateList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteTemplate.mockResolvedValue({ success: true });
    // Mock window.confirm
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders empty state when no templates', () => {
    render(<TemplateList templates={[]} />);

    expect(screen.getByText('No templates yet')).toBeInTheDocument();
    expect(screen.getByText(/create your first email template/i)).toBeInTheDocument();
  });

  it('renders list of templates', () => {
    render(<TemplateList templates={mockTemplates} />);

    expect(screen.getByText('Default Reply')).toBeInTheDocument();
    expect(screen.getByText('Custom Greeting')).toBeInTheDocument();
  });

  it('displays template subject', () => {
    render(<TemplateList templates={mockTemplates} />);

    expect(screen.getByText('Thanks for contacting us')).toBeInTheDocument();
    expect(screen.getByText('Hello {{name}}!')).toBeInTheDocument();
  });

  it('displays template slug', () => {
    render(<TemplateList templates={mockTemplates} />);

    expect(screen.getByText('default_reply')).toBeInTheDocument();
    expect(screen.getByText('custom_greeting')).toBeInTheDocument();
  });

  it('shows Default badge for default templates', () => {
    render(<TemplateList templates={mockTemplates} />);

    const badges = screen.getAllByText('Default');
    expect(badges).toHaveLength(1); // Only one default template
  });

  it('has edit link for each template', () => {
    render(<TemplateList templates={mockTemplates} />);

    const editLinks = screen.getAllByRole('link', { name: /edit/i });
    expect(editLinks).toHaveLength(2);
    expect(editLinks[0]).toHaveAttribute('href', '/dashboard/templates/1');
    expect(editLinks[1]).toHaveAttribute('href', '/dashboard/templates/2');
  });

  it('shows delete button only for non-default templates', () => {
    render(<TemplateList templates={mockTemplates} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(1); // Only custom template has delete
  });

  it('confirms before deleting template', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<TemplateList templates={mockTemplates} />);

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this template?');
    expect(mockDeleteTemplate).not.toHaveBeenCalled();
  });

  it('deletes template when confirmed', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<TemplateList templates={mockTemplates} />);

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteTemplate).toHaveBeenCalledWith(2); // Custom template id
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error alert when delete fails', async () => {
    mockDeleteTemplate.mockResolvedValue({ error: 'Cannot delete template' });
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<TemplateList templates={mockTemplates} />);

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Cannot delete template');
    });
  });
});
