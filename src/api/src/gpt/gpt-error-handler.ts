/**
 * @file gpt-error-handler.ts
 * @description A specialized error handling module for GPT-4o API interactions in the Femtosense Voice Command Generation system,
 * providing robust error management, retry logic, and standardized error reporting.
 *
 * Requirements addressed:
 * - API Error Handling (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Operational Monitoring (Technical Specification/6.3 SECURITY PROTOCOLS/6.3.1 Operational Security)
 */

import { ApiRequestError, createApiRequestError } from '@shared/errors/custom-errors';
import { logger } from '@shared/utils/logger';
import { GptApiConfig, GptApiError } from './gpt-types';
import { RETRY_CONFIG } from './gpt-config';
import { HttpStatusCode } from '@shared/interfaces/api-response.interface';

export class GptErrorHandler {
  private config: GptApiConfig;
  private retryConfig: typeof RETRY_CONFIG;

  /**
   * Initializes the error handler with API and retry configurations
   * @param config - The GPT API configuration
   * @param retryConfig - The retry configuration
   */
  constructor(config: GptApiConfig, retryConfig: typeof RETRY_CONFIG = RETRY_CONFIG) {
    this.config = config;
    this.retryConfig = retryConfig;
  }

  /**
   * Processes and transforms API errors into standardized ApiRequestError instances.
   * @param error - The error to be handled
   * @throws ApiRequestError
   */
  public handleError(error: unknown): never {
    logger.error('GPT API error occurred', { error });

    let apiError: ApiRequestError;

    if (error instanceof ApiRequestError) {
      apiError = error;
    } else if (this.isGptApiError(error)) {
      apiError = this.transformGptError(error);
    } else {
      apiError = createApiRequestError(
        error,
        'An unexpected error occurred during GPT API interaction',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    // Log the standardized error
    logger.error('Standardized GPT API error', { apiError });

    throw apiError;
  }

  /**
   * Determines if a failed request should be retried based on error type and attempt count.
   * @param error - The error that occurred
   * @param attemptNumber - The current attempt number
   * @returns Whether the request should be retried
   */
  public shouldRetry(error: ApiRequestError, attemptNumber: number): boolean {
    if (attemptNumber >= this.retryConfig.maxRetries) {
      logger.warn('Maximum retry attempts reached', { attemptNumber, maxRetries: this.retryConfig.maxRetries });
      return false;
    }

    const shouldRetry = this.retryConfig.shouldRetry(error);
    logger.debug('Retry decision', { shouldRetry, attemptNumber, errorCode: error.code });

    return shouldRetry;
  }

  /**
   * Calculates the delay before the next retry attempt using exponential backoff.
   * @param attemptNumber - The current attempt number
   * @returns The delay in milliseconds before the next retry
   */
  public getRetryDelay(attemptNumber: number): number {
    const delay = Math.min(
      this.retryConfig.delayMs * Math.pow(2, attemptNumber),
      30000 // Maximum delay of 30 seconds
    );
    logger.debug('Calculated retry delay', { attemptNumber, delay });
    return delay;
  }

  /**
   * Transforms a GPT-specific error into a standardized ApiRequestError
   * @param error - The GPT API error
   * @returns A standardized ApiRequestError
   */
  private transformGptError(error: GptApiError): ApiRequestError {
    let statusCode: HttpStatusCode;
    let message: string;

    switch (error.code) {
      case 'INVALID_API_KEY':
        statusCode = HttpStatusCode.UNAUTHORIZED;
        message = 'Invalid GPT API key';
        break;
      case 'RATE_LIMIT_EXCEEDED':
        statusCode = HttpStatusCode.TOO_MANY_REQUESTS;
        message = 'GPT API rate limit exceeded';
        break;
      case 'INVALID_MODEL':
        statusCode = HttpStatusCode.BAD_REQUEST;
        message = 'Invalid GPT model specified';
        break;
      case 'CONTEXT_LENGTH_EXCEEDED':
        statusCode = HttpStatusCode.BAD_REQUEST;
        message = 'GPT context length exceeded';
        break;
      case 'API_ERROR':
      default:
        statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        message = 'GPT API error occurred';
    }

    return new ApiRequestError(message, statusCode, { originalError: error });
  }

  /**
   * Type guard to check if an error is a GptApiError
   * @param error - The error to check
   * @returns True if the error is a GptApiError, false otherwise
   */
  private isGptApiError(error: any): error is GptApiError {
    return (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error &&
      typeof error.code === 'string' &&
      typeof error.message === 'string'
    );
  }
}

/**
 * Factory function to create a GptErrorHandler instance
 * @param config - The GPT API configuration
 * @param retryConfig - The retry configuration (optional)
 * @returns A new GptErrorHandler instance
 */
export function createGptErrorHandler(config: GptApiConfig, retryConfig?: typeof RETRY_CONFIG): GptErrorHandler {
  return new GptErrorHandler(config, retryConfig);
}