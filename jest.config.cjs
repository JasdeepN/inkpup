const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
  // Provide the path to the Next.js app so next/jest can load next.config.js,
  // environment variables, and the SWC transformer automatically
  dir: './',
});

const customConfig = {
  testEnvironment: 'jsdom',
  // only include the Jest setup (storybook's runtime shouldn't run in unit tests)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Ignore Storybook 'stories' test files in CI since they require Storybook aliases
  // that are not needed for app unit tests and can break Jest resolution in some runners.
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/', '\\.?\\.stories\\.test\\.(js|jsx|ts|tsx)$'],
  testMatch: ['<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx,mjs,cjs,mts,cts}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'mts', 'cts', 'json', 'node'],
  moduleNameMapper: {
    '^next/link$': '<rootDir>/__mocks__/next-link.js',
    '^next/image$': '<rootDir>/__mocks__/next-image.js',
    '^sb-original/(.*)$': '<rootDir>/node_modules/vite-plugin-storybook-nextjs/dist/plugins/next-image/alias/$1.cjs',
  },
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  clearMocks: true,
};

module.exports = createJestConfig(customConfig);
