/**
 * @file api-key-validator.ts
 * @description Express middleware that validates API keys for secure access to the Femtosense Voice Command Generation system endpoints.
 *
 * Requirements addressed:
 * - API Authentication (Technical Specification/6.1 AUTHENTICATION AND AUTHORIZATION)
 * - Security Protocols (Technical Specification/6.3 SECURITY PROTOCOLS)
 * - API Monitoring (Technical Specification/6.3.1 Operational Security)
 */

import { Request, Response, NextFunction } from 'express';
import { validateApiKey, API_KEY_HEADER } from '../../shared/utils/security';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { ApiRequestError } from '../../shared/errors/custom-errors';

/**
 * Express middleware function that validates the API key present in the request headers.
 * This middleware function:
 * 1. Extracts the API key from the request headers
 * 2. Validates the API key using the security utility
 * 3. Allows the request to proceed if valid
 * 4. Rejects the request with an appropriate error if invalid
 *
 * @returns {express.RequestHandler} Express middleware function
 */
export const apiKeyValidator = (): express.RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.header(API_KEY_HEADER);

      if (!apiKey) {
        throw new ApiRequestError('API key is missing', 401);
      }

      const validationResult: ApiResponse<boolean> = await validateApiKey(apiKey);

      if (!validationResult.success) {
        throw new ApiRequestError('Invalid API key', 403);
      }

      // API key is valid, proceed to the next middleware
      next();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.statusCode
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: 'Internal server error during API key validation',
            code: 500
          }
        });
      }
    }
  };
};

/**
 * Attaches the API key validator middleware to all routes that require authentication.
 * @param app Express application instance
 */
export const attachApiKeyValidator = (app: express.Application): void => {
  // Attach the middleware to all routes that require API key validation
  app.use('/api', apiKeyValidator());
};