import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Header UI flow', () => {
  test('opens mobile menu and closes on escape', async () => {
    render(<Header />);
    const btn = screen.getByRole('button');
    await userEvent.click(btn);

  const nav = screen.getByLabelText('Mobile');
  // Tailwind styles aren't applied in the test environment, assert using aria-hidden
  expect(nav).toHaveAttribute('aria-hidden', 'false');

  // Press Escape
  await userEvent.keyboard('{Escape}');
  expect(nav).toHaveAttribute('aria-hidden', 'true');
  });
});
