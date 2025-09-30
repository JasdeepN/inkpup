module.exports = {
  // Use babel-jest to transform JS/TS/TSX so JSX and ESM import syntax are handled
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Exclude Playwright e2e tests from Jest
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
  // Broaden test discovery to include components, app, pages, and tests folders
  testMatch: [
    '<rootDir>/components/**/*.test.+(ts|tsx|js)',
    '<rootDir>/app/**/?(*.)+(test|spec).+(ts|tsx|js)',
    '<rootDir>/pages/**/?(*.)+(test|spec).+(ts|tsx|js)',
    '<rootDir>/tests/**/?(*.)+(test|spec).+(ts|tsx|js)',
    '<rootDir>/**/*.(test|spec).+(ts|tsx|js)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest'
  },
  // Use ts-jest preset for TypeScript handling (remove babel-jest transform to avoid conflicts)
  moduleNameMapper: {
    '^next/link$': '<rootDir>/__mocks__/next-link.js',
    '^next/image$': '<rootDir>/__mocks__/next-image.js'
  },
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  clearMocks: true,
};
