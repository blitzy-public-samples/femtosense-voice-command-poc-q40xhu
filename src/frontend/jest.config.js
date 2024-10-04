module.exports = {
  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // The root directory that Jest should scan for tests and modules within
  rootDir: '.',

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],

  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // Run tests from one or more projects
  projects: [
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/tests/**/*.test.ts'],
    },
  ],

  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: ['<rootDir>/tests/setup.ts'],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.ts'],

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage',

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/interfaces/**',
    '!src/constants/**',
  ],

  // The threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // An object that configures minimum threshold enforcement for coverage results
  coverageReporters: ['json', 'lcov', 'text', 'clover'],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],

  // A path to a custom dependency extractor
  dependencyExtractor: '<rootDir>/dependencyExtractor.js',

  // Make calling deprecated APIs throw helpful error messages
  errorOnDeprecated: true,

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],

  // Indicates whether each individual test should be reported during the run
  verbose: true,
};