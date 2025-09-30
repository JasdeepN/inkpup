import React from 'react';
import Header from './Header';
import { within, userEvent, waitFor } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export default {
  title: 'Header',
  component: Header,
};

export const MobileMenu = () => <Header />;

MobileMenu.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  // Ensure the menu button exists and click it
  const menuBtn = canvas.getByRole('button');
  await userEvent.click(menuBtn);

  // Wait for the mobile nav to appear
  const nav = await canvas.findByRole('navigation', { hidden: true });
  expect(nav).toBeTruthy();

  // Press Escape to close
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(nav).not.toBeVisible());
};
