const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'lib/**/*.js',
    'components/**/*.js',
    'pages/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
