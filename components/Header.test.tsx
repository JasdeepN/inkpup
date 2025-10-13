import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Header UI flow', () => {
  test('opens mobile menu and closes on escape', async () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /open menu/i });
    await userEvent.click(btn);

    const nav = screen.getByLabelText('Mobile');
    // Tailwind styles aren't applied in the test environment, assert using aria-hidden
    expect(nav).toHaveAttribute('aria-hidden', 'false');

    // Press Escape
    await userEvent.keyboard('{Escape}');
    expect(nav).toHaveAttribute('aria-hidden', 'true');
  });
  test('toggles dark mode', async () => {
    document.documentElement.classList.remove('dark');
    render(<Header />);
    const btn = screen.getByRole('button', { name: /toggle dark mode/i });
    // Initial state: dark mode enabled
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    await userEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    await userEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
