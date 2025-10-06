import React from 'react';
import Header from './Header';
import { within, userEvent, waitFor, expect } from 'storybook/test';

const story = {
  title: 'Header',
  component: Header,
};

export default story;

export const MobileMenu = () => <Header />;

MobileMenu.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // Ensure the menu button exists and click it
  const menuBtn = canvas.getByRole('button', { name: /open menu/i });
  await userEvent.click(menuBtn);

  // Wait for the mobile nav to appear
  const nav = await canvas.findByRole('navigation', { name: /mobile/i });
  await expect(nav).toHaveAttribute('aria-hidden', 'false');

  // Press Escape to close
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(nav).toHaveAttribute('aria-hidden', 'true'));
};
