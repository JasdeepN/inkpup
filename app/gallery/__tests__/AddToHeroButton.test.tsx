import { render, screen } from '@testing-library/react';
import AddToHeroButton from '../AddToHeroButton';

const baseProps = {
  itemKey: 'healed/example.webp',
};

describe('AddToHeroButton', () => {
  it('renders icon-only button by default', () => {
    render(<AddToHeroButton {...baseProps} iconOnly />);

    const button = screen.getByRole('button', { name: /add to hero/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn--secondary', 'admin-gallery__action');
    expect(button.textContent?.trim()).toBe('');
  });

  it('renders text label when iconOnly is false', () => {
    render(<AddToHeroButton {...baseProps} iconOnly={false} />);

    expect(screen.getByRole('button', { name: /add to hero/i })).toHaveTextContent('Add to Hero');
  });

  it('disables the button when told to', () => {
    render(<AddToHeroButton {...baseProps} disabled iconOnly />);

    expect(screen.getByRole('button', { name: /add to hero/i })).toBeDisabled();
  });
});
