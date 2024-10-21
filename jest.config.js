// jest.config.js
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/src/**/*.test.js'], // Only include test files in src folder
    collectCoverage: true,
    coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
    coverageDirectory: '../coverage', // Output directory for coverage, relative to src
};
  