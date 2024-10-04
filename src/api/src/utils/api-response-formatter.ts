/**
 * @file api-response-formatter.ts
 * @description A utility module that standardizes and formats API responses for the Femtosense Voice Command Generation system,
 * ensuring consistent response structures across all API endpoints.
 *
 * Requirements addressed:
 * - API Response Standardization (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Error Handling (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
 * - API Monitoring (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiError,
  HttpStatusCode,
  createSuccessResponse,
  createErrorResponse
} from '../../shared/interfaces/api-response.interface';
import { logger, LogLevel } from '../../shared/utils/logger';
import { apiMetrics } from './api-metrics';

/**
 * Interface defining the structure of a response formatter object.
 */
export interface ResponseFormatter {
  success<T>(data: T, requestId?: string): ApiSuccessResponse<T>;
  error(error: Error | ApiError, requestId?: string): ApiErrorResponse;
}

/**
 * Formats a successful API response with the provided data.
 * @param data The data to be included in the response
 * @param requestId Optional unique identifier for the request
 * @returns Formatted success response
 */
export function formatSuccessResponse<T>(data: T, requestId?: string): ApiSuccessResponse<T> {
  const formattedResponse = createSuccessResponse(data, requestId || uuidv4());
  
  // Log the formatted response
  logger.info('API Success Response', {
    requestId: formattedResponse.requestId,
    responseData: formattedResponse
  });

  // Record success metric
  apiMetrics.updateRateLimit('success', 1);

  return formattedResponse;
}

/**
 * Formats an error API response with standardized error details.
 * @param error The error object or ApiError
 * @param requestId Optional unique identifier for the request
 * @returns Formatted error response
 */
export function formatErrorResponse(error: Error | ApiError, requestId?: string): ApiErrorResponse {
  const apiError: ApiError = error instanceof Error
    ? {
        code: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
        details: { stack: error.stack }
      }
    : error;

  const formattedResponse = createErrorResponse(apiError, requestId || uuidv4());

  // Log the error response
  logger.error('API Error Response', {
    requestId: formattedResponse.requestId,
    errorDetails: formattedResponse.error
  });

  // Record error metric
  apiMetrics.recordError('error', apiError.code.toString());

  return formattedResponse;
}

/**
 * Creates a response formatter function with an optional default request ID.
 * @param defaultRequestId Optional default request ID to use if not provided in individual calls
 * @returns Object containing success and error formatting functions
 */
export function createResponseFormatter(defaultRequestId?: string): ResponseFormatter {
  return {
    success<T>(data: T, requestId?: string): ApiSuccessResponse<T> {
      return formatSuccessResponse(data, requestId || defaultRequestId);
    },
    error(error: Error | ApiError, requestId?: string): ApiErrorResponse {
      return formatErrorResponse(error, requestId || defaultRequestId);
    }
  };
}

/**
 * Middleware function to attach a response formatter to the Express response object.
 */
export function responseFormatterMiddleware(req: any, res: any, next: () => void) {
  const requestId = uuidv4();
  res.formatter = createResponseFormatter(requestId);
  next();
}

/**
 * Helper function to log API responses based on their success status.
 * @param response The API response to log
 * @param level The log level to use
 */
export function logApiResponse(response: ApiResponse<unknown>, level: LogLevel = 'info'): void {
  const logMethod = logger[level].bind(logger);
  const logMessage = response.success ? 'API Success Response' : 'API Error Response';
  const logData = {
    requestId: response.requestId,
    timestamp: response.timestamp,
    ...(response.success ? { data: response.data } : { error: response.error })
  };

  logMethod(logMessage, logData);
}

/**
 * Utility function to create a standardized error object.
 * @param code HTTP status code
 * @param message Error message
 * @param details Additional error details
 * @returns Standardized ApiError object
 */
export function createApiError(code: HttpStatusCode, message: string, details?: Record<string, unknown>): ApiError {
  return { code, message, details };
}

// Export the HttpStatusCode enum for convenience
export { HttpStatusCode };