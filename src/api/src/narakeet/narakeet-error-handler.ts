/**
 * @file narakeet-error-handler.ts
 * @description A specialized error handling module for managing and standardizing errors
 * that occur during interactions with the Narakeet Text-to-Speech API in the Femtosense
 * Voice Command Generation system.
 *
 * Requirements addressed:
 * - Error Handling (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Error Standardization (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
 */

import { ApiRequestError, createApiRequestError } from '@shared/errors/custom-errors';
import { NarakeetErrorCode } from './narakeet-types';
import { logger } from '@shared/utils/logger';
import { HttpStatusCode } from '@shared/interfaces/api-response.interface';

/**
 * Custom error class for Narakeet API-specific errors
 */
export class NarakeetApiError extends ApiRequestError {
  narakeetCode: NarakeetErrorCode;

  constructor(message: string, narakeetCode: NarakeetErrorCode, details?: Record<string, unknown>) {
    const httpStatus = mapErrorCodeToHttpStatus(narakeetCode);
    super(message, httpStatus, details);
    this.narakeetCode = narakeetCode;
    this.name = 'NarakeetApiError';
  }
}

/**
 * Processes and standardizes errors from the Narakeet API
 * @param error The error object received from the Narakeet API or during processing
 * @returns A standardized NarakeetApiError
 */
export function handleNarakeetError(error: unknown): NarakeetApiError {
  logger.error('Narakeet API error occurred', { error });

  if (error instanceof NarakeetApiError) {
    return error;
  }

  let message = 'An error occurred while interacting with the Narakeet API';
  let narakeetCode = NarakeetErrorCode.UNKNOWN_ERROR;
  let details: Record<string, unknown> = {};

  if (error instanceof Error) {
    message = error.message;
    details = { stack: error.stack };
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if ('code' in errorObj && typeof errorObj.code === 'string') {
      narakeetCode = errorObj.code as NarakeetErrorCode;
    }
    if ('details' in errorObj && typeof errorObj.details === 'object') {
      details = { ...details, ...errorObj.details as Record<string, unknown> };
    }
  }

  return new NarakeetApiError(message, narakeetCode, details);
}

/**
 * Maps Narakeet-specific error codes to standard HTTP status codes
 * @param code The Narakeet error code
 * @returns The corresponding HTTP status code
 */
function mapErrorCodeToHttpStatus(code: NarakeetErrorCode): HttpStatusCode {
  switch (code) {
    case NarakeetErrorCode.INVALID_API_KEY:
      return HttpStatusCode.UNAUTHORIZED;
    case NarakeetErrorCode.RATE_LIMIT_EXCEEDED:
      return HttpStatusCode.TOO_MANY_REQUESTS;
    case NarakeetErrorCode.INVALID_REQUEST:
      return HttpStatusCode.BAD_REQUEST;
    case NarakeetErrorCode.VOICE_NOT_FOUND:
      return HttpStatusCode.NOT_FOUND;
    case NarakeetErrorCode.UNSUPPORTED_LANGUAGE:
      return HttpStatusCode.UNPROCESSABLE_ENTITY;
    case NarakeetErrorCode.SERVER_ERROR:
      return HttpStatusCode.INTERNAL_SERVER_ERROR;
    default:
      return HttpStatusCode.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Type guard to check if an error is an instance of NarakeetApiError
 * @param error The error to check
 * @returns True if the error is an instance of NarakeetApiError, false otherwise
 */
export function isNarakeetApiError(error: unknown): error is NarakeetApiError {
  return error instanceof NarakeetApiError;
}

/**
 * Wraps a function that interacts with the Narakeet API to standardize error handling
 * @param fn The function to wrap
 * @returns A wrapped function that catches and standardizes Narakeet API errors
 */
export function withNarakeetErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleNarakeetError(error);
    }
  }) as T;
}