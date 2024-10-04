/**
 * @file gpt-types.ts
 * @description This file defines the types and interfaces specific to GPT-4o API interactions
 * in the Femtosense Voice Command Generation system, ensuring type safety and consistent
 * data structures for GPT-related operations.
 *
 * Requirements addressed:
 * - Automated Voice Command Variation Generation (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 * - API Integration (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 */

import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { Intent } from '../../shared/types/intent.types';

/**
 * Enum defining available GPT models for type safety
 */
export enum GptModel {
  GPT4 = 'gpt-4',
  GPT4_32K = 'gpt-4-32k',
  GPT3_5_TURBO = 'gpt-3.5-turbo'
}

/**
 * Interface for GPT-4o API configuration settings
 */
export interface GptApiConfig {
  /** API key for authentication with GPT-4o service */
  apiKey: string;
  /** Base URL for the GPT-4o API */
  baseUrl: string;
  /** GPT model to be used for generation */
  model: GptModel;
  /** Maximum number of tokens to generate */
  maxTokens: number;
  /** Controls randomness in the output. Higher values mean more random completions. */
  temperature: number;
  /** Timeout for API requests in milliseconds */
  timeout: number;
}

/**
 * Interface for requesting command variations from GPT-4o
 */
export interface GptVariationRequest {
  /** The original phrase to generate variations for */
  phrase: string;
  /** The intent associated with the phrase */
  intent: Intent;
  /** The number of variations to generate */
  count: number;
  /** The target language for the variations */
  language: string;
}

/**
 * Interface for the data structure of generated variations
 */
export interface GptVariationData {
  /** Array of generated variation phrases */
  variations: string[];
  /** The original phrase used for generating variations */
  originalPhrase: string;
  /** The intent associated with the variations */
  intent: Intent;
}

/**
 * Interface extending ApiResponse for GPT variation generation results
 */
export interface GptVariationResponse extends ApiResponse<GptVariationData> {}

/**
 * Type for GPT-4o API error codes
 */
export type GptErrorCode = 'INVALID_API_KEY' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_MODEL' | 'CONTEXT_LENGTH_EXCEEDED' | 'API_ERROR';

/**
 * Interface for GPT-4o API errors
 */
export interface GptApiError {
  code: GptErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if a value is a valid GptModel
 * @param value - The value to check
 * @returns True if the value is a valid GptModel, false otherwise
 */
export function isValidGptModel(value: string): value is GptModel {
  return Object.values(GptModel).includes(value as GptModel);
}

/**
 * Function to create a GptApiConfig object with default values
 * @param apiKey - The API key for GPT-4o service
 * @returns A GptApiConfig object with default values
 */
export function createDefaultGptConfig(apiKey: string): GptApiConfig {
  return {
    apiKey,
    baseUrl: 'https://api.openai.com/v1',
    model: GptModel.GPT4,
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000
  };
}

/**
 * Type for functions that process GPT-4o API responses
 */
export type GptResponseProcessor = (response: GptVariationResponse) => void;

/**
 * Interface for objects that can handle GPT-4o API interactions
 */
export interface GptApiHandler {
  generateVariations(request: GptVariationRequest): Promise<GptVariationResponse>;
  updateConfig(config: Partial<GptApiConfig>): void;
  getConfig(): GptApiConfig;
}