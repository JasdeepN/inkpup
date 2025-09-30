module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/components/**/*.test.+(ts|tsx|js)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest']
  },
  moduleNameMapper: {
    '^next/link$': '<rootDir>/__mocks__/next-link.js'
  },
  transformIgnorePatterns: ['/node_modules/'],
};
