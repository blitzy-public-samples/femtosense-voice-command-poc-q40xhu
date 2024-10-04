import { Counter, Histogram, Gauge } from 'prom-client';
import express from 'express';
import { logger } from '../../shared/utils/logger';

/**
 * ApiMetrics class for comprehensive API metrics collection, monitoring, and reporting
 * for the Femtosense Voice Command Generation system.
 * 
 * Requirements addressed:
 * - API Monitoring (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)
 * - Performance Metrics (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
 * - Resource Utilization (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
 */
export class ApiMetrics {
  private static instance: ApiMetrics;
  private requestCounter: Counter;
  private responseTimeHistogram: Histogram;
  private errorCounter: Counter;
  private rateLimit: Gauge;

  private constructor() {
    this.initializeMetrics();
  }

  /**
   * Returns the singleton instance of the ApiMetrics class
   * @returns The singleton metrics instance
   */
  public static getInstance(): ApiMetrics {
    if (!ApiMetrics.instance) {
      ApiMetrics.instance = new ApiMetrics();
    }
    return ApiMetrics.instance;
  }

  /**
   * Initializes all Prometheus metrics collectors
   */
  private initializeMetrics(): void {
    this.requestCounter = new Counter({
      name: 'api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status']
    });

    this.responseTimeHistogram = new Histogram({
      name: 'api_response_time_seconds',
      help: 'Response time in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    this.errorCounter = new Counter({
      name: 'api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type']
    });

    this.rateLimit = new Gauge({
      name: 'api_rate_limit',
      help: 'Current API rate limit',
      labelNames: ['endpoint']
    });
  }

  /**
   * Returns an Express middleware function for collecting metrics
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Middleware function
   */
  public middleware(): express.RequestHandler {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const startTime = process.hrtime();

      // Increment request counter
      this.requestCounter.inc({ method: req.method, endpoint: req.path });

      // Add response listener to record metrics after response is sent
      res.on('finish', () => {
        const duration = process.hrtime(startTime);
        const responseTimeInSeconds = duration[0] + duration[1] / 1e9;

        // Record response time
        this.responseTimeHistogram.observe(
          { method: req.method, endpoint: req.path },
          responseTimeInSeconds
        );

        // Record status code
        this.requestCounter.inc({
          method: req.method,
          endpoint: req.path,
          status: res.statusCode
        });

        // Log request details
        logger.info('API Request', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: responseTimeInSeconds
        });
      });

      next();
    };
  }

  /**
   * Records an API error occurrence
   * @param endpoint The API endpoint where the error occurred
   * @param errorType The type of error
   */
  public recordError(endpoint: string, errorType: string): void {
    this.errorCounter.inc({ endpoint, error_type: errorType });
    logger.error(`API Error: ${errorType}`, { endpoint, error_type: errorType });
  }

  /**
   * Updates the rate limit for a specific endpoint
   * @param endpoint The API endpoint
   * @param limit The current rate limit
   */
  public updateRateLimit(endpoint: string, limit: number): void {
    this.rateLimit.set({ endpoint }, limit);
  }

  /**
   * Retrieves the current metrics
   * @returns An object containing all current metric values
   */
  public getMetrics(): Record<string, any> {
    return {
      requestCount: this.requestCounter.get(),
      responseTime: this.responseTimeHistogram.get(),
      errorCount: this.errorCounter.get(),
      rateLimit: this.rateLimit.get()
    };
  }
}

// Export the singleton instance
export const apiMetrics = ApiMetrics.getInstance();