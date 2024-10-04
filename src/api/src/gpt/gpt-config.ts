/**
 * @file gpt-config.ts
 * @description This file defines the configuration settings and constants for GPT-4o API integration
 * in the Femtosense Voice Command Generation system.
 *
 * Requirements addressed:
 * - GPT-4o Integration (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 * - API Configuration (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 */

import { GptApiConfig, GptModel, createDefaultGptConfig } from './gpt-types';
import { API_ENDPOINTS } from '@shared/constants/api-endpoints';

/**
 * Default configuration for GPT API
 */
export const DEFAULT_GPT_CONFIG: GptApiConfig = createDefaultGptConfig(process.env.GPT_API_KEY || '');

/**
 * Maximum number of retries for API calls
 */
export const MAX_RETRIES: number = 3;

/**
 * Delay between retries in milliseconds
 */
export const RETRY_DELAY_MS: number = 1000;

/**
 * Default timeout for API requests in milliseconds
 */
export const DEFAULT_TIMEOUT_MS: number = 30000;

/**
 * Configuration for retry mechanism
 */
export const RETRY_CONFIG = {
  maxRetries: MAX_RETRIES,
  delayMs: RETRY_DELAY_MS,
  shouldRetry: (error: any) => {
    const status = error.response?.status;
    return status === 429 || (status >= 500 && status < 600);
  }
};

/**
 * Returns a configuration object for GPT API, merging default values with any provided overrides.
 * 
 * @param overrides - Partial configuration to override default values
 * @returns Merged configuration object
 */
export function getGptConfig(overrides?: Partial<GptApiConfig>): GptApiConfig {
  // Check if overrides are provided
  if (!overrides) {
    return { ...DEFAULT_GPT_CONFIG };
  }

  // Merge default configuration with overrides
  const mergedConfig: GptApiConfig = {
    ...DEFAULT_GPT_CONFIG,
    ...overrides,
    // Ensure baseUrl is always set correctly
    baseUrl: API_ENDPOINTS.gpt.variations
  };

  // Validate the merged configuration
  if (!mergedConfig.apiKey) {
    throw new Error('GPT API key is required');
  }

  if (!Object.values(GptModel).includes(mergedConfig.model)) {
    throw new Error(`Invalid GPT model: ${mergedConfig.model}`);
  }

  if (mergedConfig.maxTokens <= 0) {
    throw new Error('maxTokens must be greater than 0');
  }

  if (mergedConfig.temperature < 0 || mergedConfig.temperature > 1) {
    throw new Error('temperature must be between 0 and 1');
  }

  if (mergedConfig.timeout < 0) {
    throw new Error('timeout must be non-negative');
  }

  // Return the resulting configuration object
  return mergedConfig;
}

/**
 * Example usage:
 * 
 * import { getGptConfig } from './gpt-config';
 * 
 * const config = getGptConfig({ temperature: 0.8, maxTokens: 1500 });
 * console.log(config);
 */