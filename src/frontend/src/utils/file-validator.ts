import * as fs from 'fs';
import * as path from 'path';
import { ERROR_MESSAGES } from '../constants/cli-messages';

// Maximum allowed path length for file and directory paths
const MAX_PATH_LENGTH = 260;

// Valid headers for the CSV file
const VALID_CSV_HEADERS = ['intent', 'phrase'];

/**
 * Validates if a given file path exists and has the correct type and permissions.
 * @param filePath - The path of the file to validate
 * @param type - The expected type of the file ('csv' or 'directory')
 * @returns True if the file path is valid and accessible, false otherwise
 */
export function validateFilePath(filePath: string, type: 'csv' | 'directory'): boolean {
  try {
    // Sanitize the input file path
    const sanitizedPath = sanitizeFilePath(filePath);

    // Check if path exists
    if (!fs.existsSync(sanitizedPath)) {
      console.error(ERROR_MESSAGES.FILE_NOT_FOUND);
      return false;
    }

    // Verify correct type
    const stats = fs.statSync(sanitizedPath);
    if (type === 'csv' && !stats.isFile()) {
      console.error(`${ERROR_MESSAGES.FILE_NOT_FOUND} Expected a file, but found a directory.`);
      return false;
    }
    if (type === 'directory' && !stats.isDirectory()) {
      console.error(`${ERROR_MESSAGES.INVALID_OUTPUT_DIR} Expected a directory, but found a file.`);
      return false;
    }

    // Check file permissions
    try {
      fs.accessSync(sanitizedPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      console.error(`${ERROR_MESSAGES.FILE_NOT_FOUND} File is not readable or writable.`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating file path: ${error}`);
    return false;
  }
}

/**
 * Checks if the given file is a valid CSV file with the required format.
 * @param filePath - The path of the CSV file to validate
 * @returns True if the file is a valid CSV with correct headers, false otherwise
 */
export function isValidCSVFile(filePath: string): boolean {
  try {
    // Check file extension
    if (path.extname(filePath).toLowerCase() !== '.csv') {
      console.error(`${ERROR_MESSAGES.FILE_NOT_FOUND} File must have a .csv extension.`);
      return false;
    }

    // Verify file can be opened
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');

    if (lines.length < 2) {
      console.error(`${ERROR_MESSAGES.FILE_NOT_FOUND} CSV file must contain at least a header and one data row.`);
      return false;
    }

    // Validate CSV headers against VALID_CSV_HEADERS
    const headers = lines[0].trim().toLowerCase().split(',');
    if (!VALID_CSV_HEADERS.every(header => headers.includes(header))) {
      console.error(`${ERROR_MESSAGES.FILE_NOT_FOUND} CSV file must contain 'intent' and 'phrase' columns.`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating CSV file: ${error}`);
    return false;
  }
}

/**
 * Validates if the output directory exists or can be created, and has write permissions.
 * @param dirPath - The path of the directory to validate
 * @returns True if the directory is valid and writable, false otherwise
 */
export function validateOutputDirectory(dirPath: string): boolean {
  try {
    // Sanitize the directory path
    const sanitizedPath = sanitizeFilePath(dirPath);

    // Check if directory exists, create if not
    if (!fs.existsSync(sanitizedPath)) {
      fs.mkdirSync(sanitizedPath, { recursive: true });
    }

    // Verify write permissions
    try {
      fs.accessSync(sanitizedPath, fs.constants.W_OK);
    } catch (err) {
      console.error(`${ERROR_MESSAGES.INVALID_OUTPUT_DIR} Directory is not writable.`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating output directory: ${error}`);
    return false;
  }
}

/**
 * Sanitizes a file path to prevent directory traversal attacks.
 * @param filePath - The file path to sanitize
 * @returns Sanitized file path
 */
function sanitizeFilePath(filePath: string): string {
  // Normalize the path
  let sanitized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');

  // Remove any directory traversal sequences
  sanitized = sanitized.replace(/\/\.\.\//g, '/').replace(/\\\.\.\\/g, '\\');

  // Verify path length against MAX_PATH_LENGTH
  if (sanitized.length > MAX_PATH_LENGTH) {
    throw new Error(`File path exceeds maximum length of ${MAX_PATH_LENGTH} characters.`);
  }

  return sanitized;
}