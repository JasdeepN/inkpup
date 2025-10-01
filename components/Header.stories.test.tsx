import { screen } from '@testing-library/react';
import { composeStories } from '@storybook/nextjs-vite';
import * as stories from './Header.stories';

const { MobileMenu } = composeStories(stories);

describe('Header stories', () => {
  test('MobileMenu story opens and closes the navigation', async () => {
    await MobileMenu.run();

    const nav = screen
      .getAllByRole('navigation', { hidden: true })
      .find((element) => element.getAttribute('aria-label') === 'Mobile');

    expect(nav).toBeDefined();
    if (!nav) throw new Error('Mobile navigation not found');

    expect(nav).toHaveAttribute('aria-hidden', 'true');
  });
});