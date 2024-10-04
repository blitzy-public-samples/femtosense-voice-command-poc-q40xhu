import { jest } from '@jest/globals';
import axios from 'axios';
import { withRetry, withApiRetry, RetryConfig, DEFAULT_RETRY_CONFIG } from '../../src/utils/retry-mechanism';
import { ApiMetrics } from '../../src/utils/api-metrics';
import { logger } from '@shared/utils/logger';

// Mock dependencies
jest.mock('../../src/utils/api-metrics');
jest.mock('@shared/utils/logger');

describe('Retry Mechanism', () => {
  let mockApiMetrics: jest.Mocked<typeof ApiMetrics>;
  let mockLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    mockApiMetrics = ApiMetrics as jest.Mocked<typeof ApiMetrics>;
    mockLogger = logger as jest.Mocked<typeof logger>;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('withRetry', () => {
    it('should execute successfully without retries', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockApiMetrics.recordError).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should retry on failure and succeed within retry limits', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockApiMetrics.recordError).toHaveBeenCalledWith('retry', 'retryable_error');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1'),
        expect.any(Object)
      );
    });

    it('should throw an error after exceeding maximum retry attempts', async () => {
      const mockError = new Error('Persistent error');
      const mockFn = jest.fn().mockRejectedValue(mockError);

      await expect(withRetry(mockFn)).rejects.toThrow('Persistent error');
      expect(mockFn).toHaveBeenCalledTimes(DEFAULT_RETRY_CONFIG.maxRetries);
      expect(mockApiMetrics.recordError).toHaveBeenCalledTimes(DEFAULT_RETRY_CONFIG.maxRetries);
    });

    it('should use exponential backoff for retry delays', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const retryPromise = withRetry(mockFn);
      
      // First retry
      jest.advanceTimersByTime(DEFAULT_RETRY_CONFIG.initialDelayMs);
      await Promise.resolve();

      // Second retry
      jest.advanceTimersByTime(DEFAULT_RETRY_CONFIG.initialDelayMs * DEFAULT_RETRY_CONFIG.backoffFactor);
      await Promise.resolve();

      const result = await retryPromise;
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should only retry on specified HTTP status codes', async () => {
      const mockAxiosError = new axios.AxiosError();
      mockAxiosError.response = { status: 503 } as any;

      const mockFn = jest.fn()
        .mockRejectedValueOnce(mockAxiosError)
        .mockResolvedValueOnce('success');

      const result = await withRetry(mockFn);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);

      const nonRetryableError = new axios.AxiosError();
      nonRetryableError.response = { status: 400 } as any;

      const mockFnNonRetryable = jest.fn().mockRejectedValue(nonRetryableError);
      await expect(withRetry(mockFnNonRetryable)).rejects.toThrow();
      expect(mockFnNonRetryable).toHaveBeenCalledTimes(1);
    });
  });

  describe('withApiRetry', () => {
    it('should handle rate limiting and update metrics', async () => {
      const rateLimitError = new axios.AxiosError();
      rateLimitError.response = { 
        status: 429, 
        headers: { 'retry-after': '30' }
      } as any;

      const mockApiCall = jest.fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce('success');

      const result = await withApiRetry(mockApiCall);

      expect(result).toBe('success');
      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(mockApiMetrics.updateRateLimit).toHaveBeenCalledWith(mockApiCall.name, 30);
      expect(mockApiMetrics.updateRateLimit).toHaveBeenCalledWith(mockApiCall.name, Infinity);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded'),
        expect.any(Object)
      );
    });

    it('should reset rate limit after successful call', async () => {
      const mockApiCall = jest.fn().mockResolvedValue('success');

      const result = await withApiRetry(mockApiCall);

      expect(result).toBe('success');
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(mockApiMetrics.updateRateLimit).toHaveBeenCalledWith(mockApiCall.name, Infinity);
    });
  });

  describe('Custom Retry Configuration', () => {
    it('should use custom retry configuration when provided', async () => {
      const customConfig: Partial<RetryConfig> = {
        maxRetries: 2,
        initialDelayMs: 500,
        maxDelayMs: 2000,
        backoffFactor: 3,
        retryableStatusCodes: [500, 503]
      };

      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(mockFn, customConfig);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1'),
        expect.objectContaining({ delay: 500 })
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 2'),
        expect.objectContaining({ delay: 1500 })
      );
    });
  });
});