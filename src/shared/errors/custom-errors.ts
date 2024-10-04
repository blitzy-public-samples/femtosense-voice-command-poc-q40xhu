/**
 * @file custom-errors.ts
 * @description This file defines custom error classes for the Femtosense Voice Command Generation system,
 * providing standardized error handling and reporting across the application.
 *
 * Requirements addressed:
 * - Error Standardization (Technical Specification/6. SECURITY CONSIDERATIONS/6.1 AUTHENTICATION AND AUTHORIZATION)
 * - API Error Handling (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 */

import { ApiError, HttpStatusCode } from '../interfaces/api-response.interface';

/**
 * Base custom error class that extends the native Error class,
 * providing consistent error creation and stack trace capture.
 */
export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Custom error class for API-related errors, implementing the ApiError interface.
 */
export class ApiRequestError extends BaseError implements ApiError {
  code: HttpStatusCode;
  details?: Record<string, unknown>;

  constructor(message: string, code: HttpStatusCode, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

/**
 * Custom error class for validation-related errors.
 */
export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Custom error class for file system-related errors.
 */
export class FileSystemError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Custom error class for voice command generation errors.
 */
export class VoiceCommandGenerationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Custom error class for audio processing errors.
 */
export class AudioProcessingError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Custom error class for AWS S3 related errors.
 */
export class S3StorageError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Function to create an ApiRequestError from any error object
 * @param error The original error object
 * @param defaultMessage A default message to use if the original error doesn't have one
 * @param defaultCode A default HTTP status code to use if not provided
 * @returns An ApiRequestError object
 */
export function createApiRequestError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  defaultCode = HttpStatusCode.INTERNAL_SERVER_ERROR
): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error;
  }

  const message = error instanceof Error ? error.message : defaultMessage;
  const code = (error as ApiError).code || defaultCode;
  const details = error instanceof Error ? { stack: error.stack } : undefined;

  return new ApiRequestError(message, code, details);
}

/**
 * Type guard to check if an error is an instance of BaseError
 * @param error The error to check
 * @returns True if the error is an instance of BaseError, false otherwise
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Type guard to check if an error is an instance of ApiRequestError
 * @param error The error to check
 * @returns True if the error is an instance of ApiRequestError, false otherwise
 */
export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}