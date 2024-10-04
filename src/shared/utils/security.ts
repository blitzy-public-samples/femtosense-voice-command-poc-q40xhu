/**
 * @file security.ts
 * @description A utility module providing security-related functions and constants for the Femtosense Voice Command Generation system,
 * ensuring secure API communication, data handling, and authentication.
 *
 * Requirements addressed:
 * - API Authentication (Technical Specification/6.1 AUTHENTICATION AND AUTHORIZATION)
 * - Data Security (Technical Specification/6.2 DATA SECURITY)
 * - Security Protocols (Technical Specification/6.3 SECURITY PROTOCOLS)
 */

import crypto from 'crypto';
import { ApiResponse, createSuccessResponse, createErrorResponse, HttpStatusCode } from '../interfaces/api-response.interface';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// Constants
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-replace-in-production';
export const API_KEY_HEADER = 'x-api-key';

/**
 * Encrypts the API key using AES-256-GCM encryption for secure storage and transmission.
 * @param apiKey The API key to encrypt
 * @returns The encrypted API key as a string
 */
export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString('hex');
}

/**
 * Decrypts an encrypted API key for use in API calls.
 * @param encryptedKey The encrypted API key
 * @returns The decrypted API key as a string
 */
export function decryptApiKey(encryptedKey: string): string {
  const buffer = Buffer.from(encryptedKey, 'hex');
  const iv = buffer.slice(0, 12);
  const tag = buffer.slice(-16);
  const encryptedText = buffer.slice(12, -16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(tag);
  const decrypted = decipher.update(encryptedText) + decipher.final('utf8');
  return decrypted;
}

/**
 * Generates a unique request ID for API call tracking and debugging.
 * @returns A unique request ID as a string
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Validates an API key against the service endpoints.
 * @param apiKey The API key to validate
 * @returns A Promise resolving to an ApiResponse indicating if the API key is valid
 */
export async function validateApiKey(apiKey: string): Promise<ApiResponse<boolean>> {
  const requestId = generateRequestId();
  try {
    // This is a mock implementation. In a real-world scenario, you would make an API call to validate the key.
    const isValid = apiKey.length === 32; // Simple check for demonstration purposes
    if (isValid) {
      return createSuccessResponse(true, requestId);
    } else {
      return createErrorResponse({
        code: HttpStatusCode.UNAUTHORIZED,
        message: 'Invalid API key',
      }, requestId);
    }
  } catch (error) {
    return createErrorResponse({
      code: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Error validating API key',
      details: { error: error.message },
    }, requestId);
  }
}

/**
 * Sanitizes user input to prevent injection attacks.
 * @param input The user input to sanitize
 * @returns The sanitized input string
 */
export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>?/gm, '');
  // Escape special characters
  sanitized = sanitized.replace(/[&<>"']/g, (char) => {
    const escapeChars: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeChars[char] || char;
  });
  return sanitized;
}

/**
 * A class that provides secure API communication methods.
 */
export class SecureAPIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = encryptApiKey(apiKey);
  }

  /**
   * Makes a secure API request with proper authentication and error handling.
   * @param endpoint The API endpoint to call
   * @param method The HTTP method to use
   * @param data Optional data to send with the request
   * @returns A Promise resolving to a typed ApiResponse
   */
  async request<T>(endpoint: string, method: string, data?: unknown): Promise<ApiResponse<T>> {
    const requestId = generateRequestId();
    try {
      const decryptedKey = decryptApiKey(this.apiKey);
      const headers = {
        [API_KEY_HEADER]: decryptedKey,
        'Content-Type': 'application/json',
      };

      const response = await fetch(endpoint, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return createSuccessResponse<T>(result, requestId);
    } catch (error) {
      return createErrorResponse({
        code: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Error making API request',
        details: { error: error.message },
      }, requestId);
    }
  }
}

// Example usage:
// const apiClient = new SecureAPIClient('your-api-key-here');
// const response = await apiClient.request<YourResponseType>(API_ENDPOINTS.gpt.variations, 'POST', { prompt: 'Your prompt here' });