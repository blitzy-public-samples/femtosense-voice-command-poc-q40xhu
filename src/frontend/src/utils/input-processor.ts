import { CLIOptions, LanguageType } from '../interfaces/cli-options.interface';
import { ERROR_MESSAGES } from '../constants/cli-messages';
import { isValidLanguageCode } from '../../shared/utils/validators';
import { validateFilePath } from './file-validator';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Processes and validates command-line inputs for the Femtosense Voice Command Generation tool.
 * This module ensures that all user inputs meet the required specifications before being used in the system.
 * 
 * @module InputProcessor
 */

/**
 * Main function to process and validate command-line arguments, returning a structured CLIOptions object.
 * 
 * @param {string[]} argv - Raw command-line arguments
 * @returns {CLIOptions} Validated and structured command-line options
 * @throws {Error} If validation fails for any of the inputs
 */
export function processInputs(argv: string[]): CLIOptions {
  const options: Partial<CLIOptions> = {};

  // Parse raw command-line arguments
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace('--', '');
    const value = argv[i + 1];
    options[key] = value;
  }

  // Validate required parameters
  if (!options.apikey || !options.language || !options.intent_csv || !options.outdir) {
    throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
  }

  // Process and validate API key
  options.apikey = validateApiKey(options.apikey);

  // Validate language code
  if (!isValidLanguageCode(options.language)) {
    throw new Error(ERROR_MESSAGES.INVALID_LANGUAGE);
  }

  // Validate input CSV file path
  if (!validateFilePath(options.intent_csv)) {
    throw new Error(ERROR_MESSAGES.FILE_NOT_FOUND);
  }

  // Validate output directory
  if (!validateOutputDirectory(options.outdir)) {
    throw new Error(ERROR_MESSAGES.INVALID_OUTPUT_DIR);
  }

  // Parse and validate skip_header option
  options.skip_header = parseSkipHeader(options.skip_header);

  return options as CLIOptions;
}

/**
 * Validates the provided API key format and length.
 * 
 * @param {string} key - The API key to validate
 * @returns {string} The validated API key
 * @throws {Error} If the API key is invalid
 */
function validateApiKey(key: string): string {
  // Check API key length
  if (key.length !== 40) {
    throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
  }

  // Validate API key format (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(key)) {
    throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
  }

  return key;
}

/**
 * Validates and ensures the output directory exists and is writable.
 * 
 * @param {string} path - The path of the output directory
 * @returns {boolean} True if directory is valid and writable, false otherwise
 */
function validateOutputDirectory(dirPath: string): boolean {
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      // Create directory if it doesn't exist
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Verify directory permissions
    fs.accessSync(dirPath, fs.constants.W_OK);
    return true;
  } catch (error) {
    console.error(`Error validating output directory: ${error.message}`);
    return false;
  }
}

/**
 * Parses and validates the skip_header option, ensuring it's a valid non-negative integer.
 * 
 * @param {string | undefined} value - The skip_header value to parse
 * @returns {number} Parsed skip_header value, defaults to 1 if undefined
 * @throws {Error} If the value is not a valid non-negative integer
 */
function parseSkipHeader(value: string | undefined): number {
  if (value === undefined) {
    return 1; // Default value
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid skip_header value: ${value}. Must be a non-negative integer.`);
  }

  return parsed;
}

/**
 * Usage example:
 * 
 * import { processInputs } from './utils/input-processor';
 * 
 * try {
 *   const options = processInputs(process.argv.slice(2));
 *   console.log('Validated options:', options);
 * } catch (error) {
 *   console.error(error.message);
 *   process.exit(1);
 * }
 */