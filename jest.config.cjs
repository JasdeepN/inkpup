const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
  // Provide the path to the Next.js app so next/jest can load next.config.js,
  // environment variables, and the SWC transformer automatically
  dir: './',
});

const customConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/', '<rootDir>/storybook.setup.ts', '<rootDir>/components/.*\\.stories\\.[jt]sx?$', '<rootDir>/app/.*\\.stories\\.[jt]sx?$'],
  testMatch: ['<rootDir>/**/*.(test|spec).{js,jsx,ts,tsx,mjs,cjs,mts,cts}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'mts', 'cts', 'json', 'node'],
  moduleNameMapper: {
    '^next/link$': '<rootDir>/__mocks__/next-link.js',
    '^next/image$': '<rootDir>/__mocks__/next-image.js',
    '^sb-original/(.*)$': '<rootDir>/node_modules/vite-plugin-storybook-nextjs/dist/plugins/next-image/alias/$1.cjs',
  },
  transformIgnorePatterns: ['/node_modules/(?!(why-is-node-running)/)'],
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
