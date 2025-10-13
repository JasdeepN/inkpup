import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Header', () => {
  test('MobileMenu opens and closes the navigation', async () => {
    render(<Header />);
    // Find the menu button and click it
    const menuBtn = screen.getByRole('button', { name: /open menu/i });
    await userEvent.click(menuBtn);

    // Wait for the mobile nav to appear
    const nav = screen.getByRole('navigation', { name: /mobile/i });
    expect(nav).toHaveAttribute('aria-hidden', 'false');

    // Press Escape to close
    await userEvent.keyboard('{Escape}');
    expect(nav).toHaveAttribute('aria-hidden', 'true');
  });
});