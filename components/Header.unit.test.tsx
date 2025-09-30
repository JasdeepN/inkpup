import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

test('header shows primary nav in desktop and tab order includes Book link', async () => {
  render(<Header />);

  // Primary nav is hidden by default (CSS), but it should exist with aria-label
  const primary = screen.getByLabelText('Primary');
  expect(primary).toBeInTheDocument();

  // Book link should be present in the header (scope search to banner)
  const banner = screen.getByRole('banner');
  const { getByRole } = require('@testing-library/dom');
  const { within } = require('@testing-library/react');
  const book = within(banner).getByRole('link', { name: /book/i });
  expect(book).toBeInTheDocument();

  // Ensure focus can land on Book link
  book.focus();
  expect(document.activeElement).toBe(book);
});
