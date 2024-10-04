import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/utils/logger';
import { apiMetrics } from '../utils/api-metrics';

/**
 * Request Logger Middleware
 * 
 * This middleware provides request logging functionality for the API endpoints
 * in the Femtosense Voice Command Generation system.
 * 
 * Requirements addressed:
 * - API Monitoring (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)
 * - Security Logging (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
 * - Performance Tracking (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
 */

export const requestLogger = (): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime();

    // Log incoming request details
    logger.info('Incoming API Request', {
      method: req.method,
      url: req.url,
      query: sanitizeQueryParams(req.query),
      headers: sanitizeHeaders(req.headers),
      ip: anonymizeIp(req.ip),
    });

    // Attach response listener
    res.on('finish', () => {
      const duration = process.hrtime(startTime);
      const durationInMs = duration[0] * 1000 + duration[1] / 1e6;

      // Log response details
      logger.info('API Response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: durationInMs,
        responseSize: res.get('Content-Length'),
      });

      // Integrate with API metrics system
      apiMetrics.middleware()(req, res, () => {});
    });

    next();
  };
};

/**
 * Sanitize query parameters to remove sensitive information
 * @param query Express query object
 * @returns Sanitized query object
 */
function sanitizeQueryParams(query: Record<string, any>): Record<string, any> {
  const sanitized = { ...query };
  const sensitiveParams = ['apiKey', 'password', 'token'];
  
  for (const param of sensitiveParams) {
    if (param in sanitized) {
      sanitized[param] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Sanitize headers to remove sensitive information
 * @param headers Express headers object
 * @returns Sanitized headers object
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie'];
  
  for (const header of sensitiveHeaders) {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Anonymize IP address for privacy
 * @param ip IP address
 * @returns Anonymized IP address
 */
function anonymizeIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  }
  return ip;
}

export default requestLogger;