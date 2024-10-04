import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import mockFs from 'mock-fs';
import { processInputs } from '../../../src/utils/input-processor';
import { ERROR_MESSAGES } from '../../../src/constants/cli-messages';
import * as validators from '../../../shared/utils/validators';

describe('InputProcessor', () => {
  // Mock valid command line arguments
  const mockValidCommandLineArgs = (): string[] => [
    '--apikey', 'PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy',
    '--language', 'korean',
    '--intent_csv', '/path/to/example.csv',
    '--outdir', '/path/to/output'
  ];

  beforeEach(() => {
    // Set up mock file system
    mockFs({
      '/path/to': {
        'example.csv': 'mock csv content',
        'output': {}
      }
    });
  });

  afterEach(() => {
    // Restore the real file system
    mockFs.restore();
  });

  test('should correctly parse valid command line arguments', () => {
    const args = mockValidCommandLineArgs();
    const result = processInputs(args);

    expect(result).toEqual({
      apikey: 'PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy',
      language: 'korean',
      intent_csv: '/path/to/example.csv',
      outdir: '/path/to/output',
      skip_header: 1
    });
  });

  test('should throw error for missing required arguments', () => {
    const args = ['--apikey', 'PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy'];
    expect(() => processInputs(args)).toThrow(ERROR_MESSAGES.INVALID_API_KEY);
  });

  test('should validate API key format', () => {
    const args = mockValidCommandLineArgs();
    args[1] = 'invalid-api-key';
    expect(() => processInputs(args)).toThrow(ERROR_MESSAGES.INVALID_API_KEY);
  });

  test('should validate language code', () => {
    jest.spyOn(validators, 'isValidLanguageCode').mockReturnValue(false);
    const args = mockValidCommandLineArgs();
    args[3] = 'invalid-language';
    expect(() => processInputs(args)).toThrow(ERROR_MESSAGES.INVALID_LANGUAGE);
  });

  test('should validate input CSV file existence', () => {
    const args = mockValidCommandLineArgs();
    args[5] = '/path/to/nonexistent.csv';
    expect(() => processInputs(args)).toThrow(ERROR_MESSAGES.FILE_NOT_FOUND);
  });

  test('should validate output directory permissions', () => {
    mockFs({
      '/path/to': {
        'example.csv': 'mock csv content',
        'output': mockFs.directory({ mode: 0o444 }) // read-only directory
      }
    });
    const args = mockValidCommandLineArgs();
    expect(() => processInputs(args)).toThrow(ERROR_MESSAGES.INVALID_OUTPUT_DIR);
  });

  test('should correctly parse skip_header option', () => {
    const args = [...mockValidCommandLineArgs(), '--skip_header', '2'];
    const result = processInputs(args);
    expect(result.skip_header).toBe(2);
  });

  test('should handle special characters in file paths', () => {
    mockFs({
      '/path/with spaces': {
        'example file.csv': 'mock csv content',
        'output dir': {}
      }
    });
    const args = [
      '--apikey', 'PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy',
      '--language', 'korean',
      '--intent_csv', '/path/with spaces/example file.csv',
      '--outdir', '/path/with spaces/output dir'
    ];
    const result = processInputs(args);
    expect(result.intent_csv).toBe('/path/with spaces/example file.csv');
    expect(result.outdir).toBe('/path/with spaces/output dir');
  });

  test('should throw error for invalid skip_header value', () => {
    const args = [...mockValidCommandLineArgs(), '--skip_header', '-1'];
    expect(() => processInputs(args)).toThrow('Invalid skip_header value: -1. Must be a non-negative integer.');
  });

  test('should create output directory if it does not exist', () => {
    mockFs({
      '/path/to': {
        'example.csv': 'mock csv content'
      }
    });
    const args = mockValidCommandLineArgs();
    processInputs(args);
    expect(mockFs.existsSync('/path/to/output')).toBe(true);
  });
});