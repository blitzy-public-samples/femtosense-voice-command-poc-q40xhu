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
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@gpt/(.*)$': '<rootDir>/src/gpt/$1',
    '^@narakeet/(.*)$': '<rootDir>/src/narakeet/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
  },

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/coverage',

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**/*',
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

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text', 'lcov', 'clover'],

  // Setup files after env is loaded
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/',
  ],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFiles: ['dotenv/config'],
};