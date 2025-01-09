module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/setup/setup.js',
  globalTeardown: './tests/setup/teardown.js',
  testMatch: ['**/tests/**/*.test.js'],
  restoreMocks: true,
  resetMocks: true,
  clearMocks: true
};
