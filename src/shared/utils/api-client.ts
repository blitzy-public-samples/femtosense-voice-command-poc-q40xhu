/**
 * @file api-client.ts
 * @description A utility module that provides a standardized client for making HTTP requests to external APIs (GPT-4o and Narakeet) in the Femtosense Voice Command Generation system.
 * 
 * Requirements addressed:
 * - API Integration (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Security (Technical Specification/6. SECURITY CONSIDERATIONS/6.1 AUTHENTICATION AND AUTHORIZATION)
 * - Error Handling (Technical Specification/3.6 Component Details)
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ApiResponse, createSuccessResponse, createErrorResponse, HttpStatusCode } from '../interfaces/api-response.interface';
import { SecureAPIClient } from '../utils/security';
import { logger } from '../utils/logger';

// Global constants
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

// HTTP method type
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Request configuration interface
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
}

/**
 * APIClient class that provides methods for making API requests with built-in security, retries, and error handling.
 */
export class APIClient {
  private secureClient: SecureAPIClient;
  private axiosInstance: AxiosInstance;

  /**
   * Initializes the API client with the provided API key
   * @param apiKey The API key for authentication
   */
  constructor(apiKey: string) {
    this.secureClient = new SecureAPIClient(apiKey);
    this.initializeAxiosInstance();
  }

  /**
   * Initializes and configures the Axios instance with default settings and interceptors.
   */
  private initializeAxiosInstance(): void {
    this.axiosInstance = axios.create({
      timeout: DEFAULT_TIMEOUT,
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.debug('Outgoing request', { url: config.url, method: config.method });
        return config;
      },
      (error) => {
        logger.error('Request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug('Response received', { status: response.status, url: response.config.url });
        return response;
      },
      (error) => {
        logger.error('Response error', { error: error.message, url: error.config?.url });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Makes an API request with automatic retries and error handling.
   * @param endpoint The API endpoint to call
   * @param method The HTTP method to use
   * @param data Optional data to send with the request
   * @param config Optional request configuration
   * @returns A promise that resolves to a typed API response
   */
  public async request<T>(
    endpoint: string,
    method: HttpMethod,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      url: endpoint,
      method,
      data,
      timeout: config.timeout || DEFAULT_TIMEOUT,
      headers: {
        ...config.headers,
        'Content-Type': 'application/json',
      },
    };

    return this.retryRequest<T>(requestConfig, config.retries || MAX_RETRIES);
  }

  /**
   * Implements retry logic for failed API requests.
   * @param config The Axios request configuration
   * @param retriesLeft The number of retries left
   * @returns A promise that resolves to a typed API response
   */
  private async retryRequest<T>(
    config: AxiosRequestConfig,
    retriesLeft: number
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.request<T>(config);
      return createSuccessResponse<T>(response.data, response.headers['x-request-id'] || '');
    } catch (error) {
      if (retriesLeft === 0 || !this.shouldRetry(error)) {
        return this.handleRequestError(error);
      }

      logger.warn(`Retrying request to ${config.url}. Retries left: ${retriesLeft - 1}`);
      await this.delay(this.getRetryDelay(MAX_RETRIES - retriesLeft + 1));
      return this.retryRequest<T>(config, retriesLeft - 1);
    }
  }

  /**
   * Determines if a request should be retried based on the error.
   * @param error The error from the failed request
   * @returns A boolean indicating whether the request should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      (error.response && error.response.status >= 500)
    );
  }

  /**
   * Calculates the delay before the next retry attempt.
   * @param retryCount The current retry attempt number
   * @returns The delay in milliseconds
   */
  private getRetryDelay(retryCount: number): number {
    return Math.min(1000 * 2 ** retryCount, 10000); // Max delay of 10 seconds
  }

  /**
   * Handles request errors and creates an appropriate error response.
   * @param error The error from the failed request
   * @returns An API error response
   */
  private handleRequestError(error: AxiosError): ApiErrorResponse {
    const requestId = error.response?.headers['x-request-id'] || '';
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return createErrorResponse(
        {
          code: error.response.status as HttpStatusCode,
          message: error.response.data.message || 'An error occurred while processing the request',
          details: error.response.data,
        },
        requestId
      );
    } else if (error.request) {
      // The request was made but no response was received
      return createErrorResponse(
        {
          code: HttpStatusCode.INTERNAL_SERVER_ERROR,
          message: 'No response received from the server',
          details: { error: error.message },
        },
        requestId
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      return createErrorResponse(
        {
          code: HttpStatusCode.INTERNAL_SERVER_ERROR,
          message: 'An error occurred while setting up the request',
          details: { error: error.message },
        },
        requestId
      );
    }
  }

  /**
   * Utility method to introduce a delay.
   * @param ms The number of milliseconds to delay
   * @returns A promise that resolves after the specified delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Makes a request to the GPT-4o API to generate variations of a phrase.
   * @param phrase The phrase to generate variations for
   * @param count The number of variations to generate
   * @returns A promise that resolves to an API response containing the generated variations
   */
  public async generateVariations(phrase: string, count: number): Promise<ApiResponse<string[]>> {
    return this.request<string[]>(
      API_ENDPOINTS.gpt.variations,
      'POST',
      { prompt: `Generate ${count} natural variations of: ${phrase}`, max_tokens: 1000 }
    );
  }

  /**
   * Makes a request to the Narakeet API to generate audio for a given text and voice.
   * @param text The text to convert to speech
   * @param voice The voice ID to use for text-to-speech
   * @returns A promise that resolves to an API response containing the generated audio data
   */
  public async generateAudio(text: string, voice: string): Promise<ApiResponse<ArrayBuffer>> {
    return this.request<ArrayBuffer>(
      `${API_ENDPOINTS.narakeet.tts}?voice=${encodeURIComponent(voice)}`,
      'POST',
      text,
      { headers: { 'Content-Type': 'text/plain' } }
    );
  }
}

// Example usage:
// const apiClient = new APIClient('your-api-key-here');
// const variationsResponse = await apiClient.generateVariations('Turn on the lights', 5);
// const audioResponse = await apiClient.generateAudio('Hello, world!', 'en-US-Wavenet-A');