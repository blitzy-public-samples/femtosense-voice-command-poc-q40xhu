import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { validateOptions, ValidationError } from '../../src/commands/validate';
import { CLIOptions } from '../../src/interfaces/cli-options.interface';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../src/constants/cli-messages';

// Mock the file system modules
jest.mock('fs');
jest.mock('path');

describe('validateOptions', () => {
  const TEST_DIR = path.join(__dirname, 'test-files');
  const TEST_CSV = path.join(TEST_DIR, 'test.csv');
  const TEST_OUTPUT = path.join(TEST_DIR, 'output');

  const mockValidOptions: CLIOptions = {
    apikey: 'PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy',
    language: 'korean',
    intent_csv: TEST_CSV,
    outdir: TEST_OUTPUT,
    skip_header: 1
  };

  beforeEach(() => {
    // Create test directory and files
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(TEST_CSV, 'intent,phrase\nLIGHTS_ON,불 켜줘');
  });

  afterEach(() => {
    // Clean up test files
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    jest.resetAllMocks();
  });

  test('should return true for valid options', async () => {
    const result = await validateOptions(mockValidOptions);
    expect(result).toBe(true);
    expect(console.log).toHaveBeenCalledWith(SUCCESS_MESSAGES.PROCESS_COMPLETE);
  });

  test('should throw ValidationError for invalid API key', async () => {
    const invalidOptions = { ...mockValidOptions, apikey: 'invalid_key' };
    const result = await validateOptions(invalidOptions);
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(ERROR_MESSAGES.INVALID_API_KEY);
  });

  test('should throw ValidationError for invalid language', async () => {
    const invalidOptions = { ...mockValidOptions, language: 'french' as any };
    const result = await validateOptions(invalidOptions);
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(ERROR_MESSAGES.INVALID_LANGUAGE);
  });

  test('should throw ValidationError for non-existent CSV file', async () => {
    const invalidOptions = { ...mockValidOptions, intent_csv: 'non_existent.csv' };
    const result = await validateOptions(invalidOptions);
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(ERROR_MESSAGES.FILE_NOT_FOUND);
  });

  test('should throw ValidationError for invalid output directory', async () => {
    const invalidOptions = { ...mockValidOptions, outdir: '/invalid/path' };
    const result = await validateOptions(invalidOptions);
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(ERROR_MESSAGES.INVALID_OUTPUT_DIR);
  });

  test('should handle unexpected errors', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Unexpected error');
    jest.spyOn(fs, 'accessSync').mockImplementation(() => { throw mockError; });

    const result = await validateOptions(mockValidOptions);
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith(`Validation error: ${mockError.message}`);
  });
});

describe('ValidationError', () => {
  test('should create a ValidationError with correct properties', () => {
    const error = new ValidationError('ERR001', 'Test error', 'Error details');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('ERR001');
    expect(error.message).toBe('Test error');
    expect(error.details).toBe('Error details');
  });
});