module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/frontend/__tests__/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/frontend/$1',
    '^~backend/(.*)$': '<rootDir>/backend/$1',
  },
  testMatch: [
    '<rootDir>/frontend/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/backend/**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'frontend/**/*.{ts,tsx}',
    'backend/**/*.{ts,tsx}',
    '!frontend/**/*.d.ts',
    '!backend/**/*.d.ts',
    '!frontend/__tests__/**',
    '!backend/**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
};
