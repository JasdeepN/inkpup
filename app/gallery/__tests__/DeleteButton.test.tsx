import { render, screen } from '@testing-library/react';
import DeleteButton from '../DeleteButton';

const baseProps = {
  category: 'healed',
  itemKey: 'healed/example.webp',
  canMutate: true,
};

describe('DeleteButton', () => {
  it('renders icon-only button when iconOnly is true', () => {
    render(<DeleteButton {...baseProps} iconOnly />);

    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn--danger', 'admin-gallery__action');
    expect(button.textContent?.trim()).toBe('');
  });

  it('renders text label when iconOnly is false', () => {
    render(<DeleteButton {...baseProps} iconOnly={false} />);

    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveTextContent('Delete');
  });

  it('disables the button when mutations are not allowed', () => {
    render(<DeleteButton {...baseProps} canMutate={false} iconOnly />);

    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });
});
