/**
 * @file api-response.interface.ts
 * @description This file defines the standardized structure for API responses across the Femtosense Voice Command Generation system.
 * It ensures consistent response formats for both GPT-4o and Narakeet API interactions.
 * 
 * Requirements addressed:
 * - API Response Standardization (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Error Handling (Technical Specification/6. SECURITY CONSIDERATIONS/6.1 AUTHENTICATION AND AUTHORIZATION)
 */

/**
 * Enum for standard HTTP status codes.
 * This should be imported from a separate file, but for this implementation we'll define it here.
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

/**
 * Interface defining the structure for error information in API responses.
 */
export interface ApiError {
  /** The HTTP status code of the error */
  code: HttpStatusCode;
  /** A human-readable error message */
  message: string;
  /** Optional object containing additional error details */
  details?: Record<string, unknown>;
}

/**
 * Generic interface for standardized API responses across the system.
 * The type parameter T allows for flexible response data types while maintaining a consistent overall structure.
 */
export interface ApiResponse<T> {
  /** Indicates whether the API call was successful */
  success: boolean;
  /** The main payload of the response, present only in successful responses */
  data?: T;
  /** Error information, present only in error responses */
  error?: ApiError;
  /** ISO 8601 formatted timestamp of when the response was generated */
  timestamp: string;
  /** Unique identifier for the request, useful for logging and debugging */
  requestId: string;
}

/**
 * Type alias for successful API responses, ensuring data is present and error is absent.
 */
export type ApiSuccessResponse<T> = Required<Pick<ApiResponse<T>, 'data'>> & Omit<ApiResponse<T>, 'error' | 'data'>;

/**
 * Type alias for error API responses, ensuring error is present and data is absent.
 */
export type ApiErrorResponse = Required<Pick<ApiResponse<never>, 'error'>> & Omit<ApiResponse<never>, 'data' | 'error'>;

/**
 * Function to create a success response
 * @param data The data to be included in the response
 * @param requestId The unique identifier for the request
 * @returns An ApiSuccessResponse object
 */
export function createSuccessResponse<T>(data: T, requestId: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId
  };
}

/**
 * Function to create an error response
 * @param error The error information
 * @param requestId The unique identifier for the request
 * @returns An ApiErrorResponse object
 */
export function createErrorResponse(error: ApiError, requestId: string): ApiErrorResponse {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    requestId
  };
}