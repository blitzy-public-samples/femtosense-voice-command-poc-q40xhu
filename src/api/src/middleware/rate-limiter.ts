/**
 * @file rate-limiter.ts
 * @description Implements rate limiting functionality for the Femtosense Voice Command Generation system's API endpoints.
 * This middleware prevents abuse and ensures fair usage of the API resources.
 *
 * Requirements addressed:
 * - API Protection (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
 * - Resource Management (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
 * - Performance Monitoring (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { ApiResponse, createErrorResponse, HttpStatusCode } from '../../../shared/interfaces/api-response.interface';
import { logger } from '../../../shared/utils/logger';
import { apiMetrics } from '../utils/api-metrics';

// Define default rate limit values
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 100;

/**
 * Interface for rate limiter options
 */
export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
}

/**
 * Interface for rate limit information included in API responses
 */
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

/**
 * Creates and returns an Express middleware function that implements rate limiting
 * based on the provided options or default values.
 *
 * @param options - Configuration options for the rate limiter
 * @returns Express middleware function for rate limiting
 */
export function createRateLimiter(options: RateLimiterOptions = {}): RateLimitRequestHandler {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
    message = 'Too many requests, please try again later.',
    statusCode = HttpStatusCode.TOO_MANY_REQUESTS,
    keyGenerator
  } = options;

  const limiter = rateLimit({
    windowMs,
    max: maxRequests,
    message,
    statusCode,
    keyGenerator,
    handler: (req: Request, res: Response): void => {
      const errorResponse: ApiResponse<never> = createErrorResponse(
        {
          code: HttpStatusCode.TOO_MANY_REQUESTS,
          message: message
        },
        req.ip
      );
      res.status(statusCode).json(errorResponse);
    },
    skip: (req: Request): boolean => {
      // Implement any logic to skip rate limiting for certain requests (e.g., whitelisted IPs)
      return false;
    },
    onLimitReached: (req: Request, res: Response, options: RateLimiterOptions): void => {
      logger.warn('Rate limit reached', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        limit: maxRequests,
        windowMs
      });
      apiMetrics.recordError(req.path, 'RATE_LIMIT_EXCEEDED');
    }
  });

  // Wrap the limiter middleware to add custom headers and logging
  return (req: Request, res: Response, next: NextFunction): void => {
    limiter(req, res, () => {
      // Add custom rate limit headers
      const rateLimitInfo: RateLimitInfo = {
        limit: maxRequests,
        current: res.getHeader('X-RateLimit-Remaining') as number,
        remaining: res.getHeader('X-RateLimit-Remaining') as number,
        resetTime: new Date(res.getHeader('X-RateLimit-Reset') as number * 1000)
      };

      res.setHeader('X-RateLimit-Limit', rateLimitInfo.limit);
      res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetTime.toISOString());

      // Log rate limit information
      logger.debug('Rate limit status', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        ...rateLimitInfo
      });

      // Update rate limit metrics
      apiMetrics.updateRateLimit(req.path, rateLimitInfo.remaining);

      next();
    });
  };
}

/**
 * Default rate limiter middleware with pre-configured options
 */
export const defaultRateLimiter = createRateLimiter();

/**
 * Higher rate limit for authenticated users
 */
export const authenticatedRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes
  message: 'Authenticated rate limit exceeded, please try again later.',
  keyGenerator: (req: Request): string => {
    // Use a unique identifier for authenticated users (e.g., user ID or API key)
    return req.user?.id || req.ip;
  }
});

/**
 * Stricter rate limit for sensitive operations
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // 50 requests per hour
  message: 'Strict rate limit exceeded for sensitive operation, please try again later.',
});

/**
 * Dynamic rate limiter based on user tier
 */
export function dynamicRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const userTier = req.user?.tier || 'free';
  const tierLimits: Record<string, RateLimiterOptions> = {
    free: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
    pro: { maxRequests: 1000, windowMs: 15 * 60 * 1000 },
    enterprise: { maxRequests: 10000, windowMs: 15 * 60 * 1000 }
  };

  const limiter = createRateLimiter(tierLimits[userTier]);
  limiter(req, res, next);
}