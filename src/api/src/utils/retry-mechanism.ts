import axios, { AxiosError } from 'axios';
import { logger } from '../../shared/utils/logger';
import { apiMetrics } from './api-metrics';

/**
 * Configuration interface for customizing retry behavior
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

/**
 * Type definition for functions that can be retried
 */
type RetryableFunction<T> = () => Promise<T>;

/**
 * Default retry configuration
 * Requirements addressed:
 * - API Resilience (Technical Specification/3.6 Component Details)
 * - Rate Limiting (Technical Specification/7.1.1 Voice Registry Details)
 * - Operational Reliability (Technical Specification/6.3.1 Operational Security)
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

/**
 * A higher-order function that wraps an async function with retry logic
 * @param fn The function to be retried
 * @param config Custom retry configuration (optional)
 * @returns A promise that resolves with the result of the retried function
 */
export async function withRetry<T>(fn: RetryableFunction<T>, config: Partial<RetryConfig> = {}): Promise<T> {
  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let attempt = 0;

  while (attempt < retryConfig.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableError(error, retryConfig) || attempt === retryConfig.maxRetries - 1) {
        throw error;
      }

      const delay = calculateBackoff(attempt, retryConfig);
      logger.warn(`Retry attempt ${attempt + 1} for operation. Retrying in ${delay}ms`, {
        attempt: attempt + 1,
        delay,
        error: error.message
      });

      apiMetrics.recordError('retry', 'retryable_error');
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw new Error('Max retries reached');
}

/**
 * Calculates the delay time for the next retry attempt using exponential backoff
 * @param attempt The current attempt number
 * @param config The retry configuration
 * @returns The calculated delay time in milliseconds
 */
function calculateBackoff(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Determines if an error should trigger a retry attempt
 * @param error The error to check
 * @param config The retry configuration
 * @returns Whether the error is retryable
 */
function isRetryableError(error: any, config: RetryConfig): boolean {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return true;
    }
    if (axiosError.response && config.retryableStatusCodes.includes(axiosError.response.status)) {
      return true;
    }
  }
  return false;
}

/**
 * Retry mechanism specifically for API calls
 * @param apiCall The API call function to be retried
 * @param config Custom retry configuration (optional)
 * @returns A promise that resolves with the result of the retried API call
 */
export async function withApiRetry<T>(apiCall: RetryableFunction<T>, config: Partial<RetryConfig> = {}): Promise<T> {
  return withRetry(async () => {
    try {
      const result = await apiCall();
      apiMetrics.updateRateLimit(apiCall.name, Infinity); // Reset rate limit after successful call
      return result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
        apiMetrics.updateRateLimit(apiCall.name, retryAfter);
        logger.warn(`Rate limit exceeded for ${apiCall.name}. Retry after ${retryAfter} seconds.`);
      }
      throw error;
    }
  }, config);
}

/**
 * Exports the default retry configuration for use in other modules
 */
export { DEFAULT_RETRY_CONFIG };