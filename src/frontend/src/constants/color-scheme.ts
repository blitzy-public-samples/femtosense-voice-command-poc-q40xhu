/**
 * This file defines the color constants used throughout the frontend CLI application
 * for consistent and visually appealing terminal output.
 * 
 * Requirements addressed:
 * - User-friendly CLI (Technical Specification/2.4 USER INTERFACE DESIGN)
 * - Consistent Styling (Technical Specification/2.5 THEME DESIGN)
 */

/**
 * Enum representing ANSI color codes for terminal output.
 * These colors are used to enhance readability and provide visual cues in the CLI.
 */
export enum Colors {
  SUCCESS = '\x1b[32m', // Green color for successful operations
  WARNING = '\x1b[33m', // Yellow color for warnings
  ERROR = '\x1b[31m',   // Red color for error messages
  INFO = '\x1b[36m'     // Cyan color for informational messages
}

/**
 * Constant to reset all color formatting in the terminal.
 * This should be used after applying a color to ensure subsequent text is not affected.
 */
export const RESET = '\x1b[0m';

/**
 * Usage example:
 * 
 * import { Colors, RESET } from '../constants/color-scheme';
 * 
 * console.log(`${Colors.SUCCESS}✓ Operation completed successfully${RESET}`);
 * console.log(`${Colors.ERROR}✗ Error: Operation failed${RESET}`);
 */

/**
 * Function to wrap a message with a specific color and reset afterwards.
 * This ensures that the color is always reset after the message.
 * 
 * @param message - The message to be colored
 * @param color - The color to apply to the message
 * @returns The message wrapped with the specified color and reset code
 */
export function colorize(message: string, color: Colors): string {
  return `${color}${message}${RESET}`;
}

/**
 * Predefined color functions for common use cases
 */
export const successMessage = (message: string) => colorize(message, Colors.SUCCESS);
export const warningMessage = (message: string) => colorize(message, Colors.WARNING);
export const errorMessage = (message: string) => colorize(message, Colors.ERROR);
export const infoMessage = (message: string) => colorize(message, Colors.INFO);

/**
 * Usage example with predefined color functions:
 * 
 * import { successMessage, errorMessage } from '../constants/color-scheme';
 * 
 * console.log(successMessage('✓ Operation completed successfully'));
 * console.log(errorMessage('✗ Error: Operation failed'));
 */