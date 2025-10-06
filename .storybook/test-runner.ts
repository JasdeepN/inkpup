import type { TestRunnerConfig } from '@storybook/test-runner';
import type { Page } from '@playwright/test';

const config: TestRunnerConfig = {
  async postVisit(page: Page) {
    const root = await page.$('#storybook-root');
    const markup = await root?.innerHTML();

    expect(markup ?? '').toMatchSnapshot();
  },
};

export default config;