/**
 * @file rate-limiter.test.ts
 * @description Test suite for the rate limiting middleware of the Femtosense Voice Command Generation system's API.
 *
 * Requirements addressed:
 * - API Protection Testing (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
 * - Resource Management Validation (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
 * - Performance Monitoring Testing (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)
 */

import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { createRateLimiter, RateLimiterOptions, defaultRateLimiter, authenticatedRateLimiter, strictRateLimiter, dynamicRateLimiter } from '../../src/middleware/rate-limiter';
import { ApiResponse, HttpStatusCode } from '../../../shared/interfaces/api-response.interface';
import { apiMetrics } from '../../src/utils/api-metrics';

// Mock the apiMetrics module
jest.mock('../../src/utils/api-metrics', () => ({
  apiMetrics: {
    recordError: jest.fn(),
    updateRateLimit: jest.fn(),
  },
}));

describe('Rate Limiter Middleware', () => {
  let app: express.Application;
  const testEndpoint = '/api/test';

  beforeEach(() => {
    app = express();
    jest.clearAllMocks();
  });

  describe('createRateLimiter', () => {
    it('should allow requests within the rate limit', async () => {
      const options: RateLimiterOptions = {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
      };
      app.use(createRateLimiter(options));
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      for (let i = 0; i < 5; i++) {
        const response = await request(app).get(testEndpoint);
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Success');
        expect(response.headers['x-ratelimit-limit']).toBe('5');
        expect(parseInt(response.headers['x-ratelimit-remaining'] as string)).toBe(4 - i);
      }
    });

    it('should block requests exceeding the rate limit', async () => {
      const options: RateLimiterOptions = {
        windowMs: 15 * 60 * 1000,
        maxRequests: 3,
        message: 'Custom rate limit message',
      };
      app.use(createRateLimiter(options));
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      for (let i = 0; i < 3; i++) {
        await request(app).get(testEndpoint);
      }

      const response = await request(app).get(testEndpoint);
      expect(response.status).toBe(HttpStatusCode.TOO_MANY_REQUESTS);
      expect(response.body.error.message).toBe('Custom rate limit message');
      expect(apiMetrics.recordError).toHaveBeenCalledWith(testEndpoint, 'RATE_LIMIT_EXCEEDED');
    });

    it('should use custom key generator', async () => {
      const options: RateLimiterOptions = {
        windowMs: 15 * 60 * 1000,
        maxRequests: 2,
        keyGenerator: (req: Request) => req.get('X-API-Key') || req.ip,
      };
      app.use(createRateLimiter(options));
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      await request(app).get(testEndpoint).set('X-API-Key', 'key1');
      await request(app).get(testEndpoint).set('X-API-Key', 'key1');
      const response1 = await request(app).get(testEndpoint).set('X-API-Key', 'key1');
      expect(response1.status).toBe(HttpStatusCode.TOO_MANY_REQUESTS);

      const response2 = await request(app).get(testEndpoint).set('X-API-Key', 'key2');
      expect(response2.status).toBe(200);
    });
  });

  describe('defaultRateLimiter', () => {
    it('should use default options', async () => {
      app.use(defaultRateLimiter);
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      const response = await request(app).get(testEndpoint);
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(parseInt(response.headers['x-ratelimit-remaining'] as string)).toBe(99);
    });
  });

  describe('authenticatedRateLimiter', () => {
    it('should apply higher rate limit for authenticated users', async () => {
      app.use((req: Request, res: Response, next: NextFunction) => {
        req.user = { id: 'test-user' };
        next();
      });
      app.use(authenticatedRateLimiter);
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      const response = await request(app).get(testEndpoint);
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('1000');
    });
  });

  describe('strictRateLimiter', () => {
    it('should apply stricter rate limit', async () => {
      app.use(strictRateLimiter);
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      const response = await request(app).get(testEndpoint);
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('50');
    });
  });

  describe('dynamicRateLimiter', () => {
    it('should apply rate limit based on user tier', async () => {
      app.use((req: Request, res: Response, next: NextFunction) => {
        req.user = { tier: 'pro' };
        next();
      });
      app.use(dynamicRateLimiter);
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      const response = await request(app).get(testEndpoint);
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('1000');
    });

    it('should use free tier limit for unauthenticated users', async () => {
      app.use(dynamicRateLimiter);
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      const response = await request(app).get(testEndpoint);
      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('100');
    });
  });

  describe('Rate limit headers', () => {
    it('should include correct rate limit headers', async () => {
      app.use(createRateLimiter({ windowMs: 60000, maxRequests: 10 }));
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      const response = await request(app).get(testEndpoint);
      expect(response.headers['x-ratelimit-limit']).toBe('10');
      expect(response.headers['x-ratelimit-remaining']).toBe('9');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('API metrics integration', () => {
    it('should update rate limit metrics', async () => {
      app.use(createRateLimiter({ windowMs: 60000, maxRequests: 5 }));
      app.get(testEndpoint, (req: Request, res: Response) => {
        res.status(200).json({ message: 'Success' });
      });

      await request(app).get(testEndpoint);
      expect(apiMetrics.updateRateLimit).toHaveBeenCalledWith(testEndpoint, 4);
    });
  });
});