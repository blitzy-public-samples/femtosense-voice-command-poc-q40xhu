/**
 * @file gpt-client.ts
 * @description Implements the GPT-4o API client for generating voice command variations
 * in the Femtosense Voice Command Generation system.
 *
 * Requirements addressed:
 * - Automated Voice Command Variation Generation (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 * - API Integration (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Multi-language Support (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 */

import axios, { AxiosInstance } from 'axios';
import {
  GptApiConfig,
  GptVariationRequest,
  GptVariationResponse,
  GptVariationData,
  GptModel,
} from './gpt-types';
import { getGptConfig, RETRY_CONFIG } from './gpt-config';
import { GptErrorHandler, createGptErrorHandler } from './gpt-error-handler';
import { APIClient } from '@shared/utils/api-client';
import { logger } from '@shared/utils/logger';
import { ApiResponse, HttpStatusCode } from '@shared/interfaces/api-response.interface';

export class GptClient {
  private apiClient: APIClient;
  private errorHandler: GptErrorHandler;
  private config: GptApiConfig;

  /**
   * Initializes the GPT client with optional configuration overrides
   * @param config - Partial configuration to override default settings
   * @param retryConfig - Configuration for retry mechanism
   */
  constructor(config: Partial<GptApiConfig> = {}, retryConfig = RETRY_CONFIG) {
    this.config = getGptConfig(config);
    this.apiClient = new APIClient(this.config.apiKey);
    this.errorHandler = createGptErrorHandler(this.config, retryConfig);
  }

  /**
   * Generates variations of a given voice command using the GPT-4o API.
   * @param request - The request object containing phrase, intent, count, and language
   * @returns A promise that resolves to the generated variations
   */
  public async generateVariations(request: GptVariationRequest): Promise<GptVariationResponse> {
    try {
      logger.info('Generating variations', { request });

      const prompt = this.buildPrompt(request);
      const apiResponse = await this.apiClient.request<GptVariationData>(
        this.config.baseUrl,
        'POST',
        {
          model: this.config.model,
          prompt,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          n: request.count,
        },
        { timeout: this.config.timeout }
      );

      const validatedResponse = this.validateResponse(apiResponse);
      logger.info('Variations generated successfully', { count: validatedResponse.data.variations.length });

      return validatedResponse;
    } catch (error) {
      return this.errorHandler.handleError(error);
    }
  }

  /**
   * Validates and transforms the raw API response into a standardized format.
   * @param response - The raw API response
   * @returns Standardized response object
   */
  private validateResponse(response: ApiResponse<any>): GptVariationResponse {
    if (!response.success || !response.data || !Array.isArray(response.data.choices)) {
      throw new Error('Invalid GPT API response structure');
    }

    const variations = response.data.choices.map((choice: any) => choice.text.trim());
    const validatedData: GptVariationData = {
      variations,
      originalPhrase: response.data.originalPhrase,
      intent: response.data.intent,
    };

    return {
      success: true,
      data: validatedData,
      requestId: response.requestId,
    };
  }

  /**
   * Constructs the prompt for the GPT model based on the request parameters.
   * @param request - The variation request object
   * @returns Constructed prompt for the GPT model
   */
  private buildPrompt(request: GptVariationRequest): string {
    const { phrase, intent, language } = request;
    let prompt = `Generate ${request.count} natural variations of the following ${language} voice command: "${phrase}"\n\n`;
    prompt += `Intent: ${intent}\n`;
    prompt += `Language: ${language}\n`;
    prompt += 'Rules:\n';
    prompt += '1. Maintain the original intent and meaning\n';
    prompt += '2. Use natural language appropriate for voice commands\n';
    prompt += '3. Vary the sentence structure and vocabulary\n';
    prompt += '4. Ensure grammatical correctness\n';
    prompt += '5. Keep each variation concise\n\n';
    prompt += 'Variations:\n';

    return prompt;
  }

  /**
   * Updates the client configuration
   * @param newConfig - Partial configuration to update
   */
  public updateConfig(newConfig: Partial<GptApiConfig>): void {
    this.config = getGptConfig({ ...this.config, ...newConfig });
    this.apiClient = new APIClient(this.config.apiKey);
    this.errorHandler = createGptErrorHandler(this.config);
  }

  /**
   * Retrieves the current client configuration
   * @returns The current GptApiConfig
   */
  public getConfig(): GptApiConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create a GptClient instance
 * @param config - Partial configuration for the GPT client
 * @param retryConfig - Configuration for the retry mechanism
 * @returns A new GptClient instance
 */
export function createGptClient(config?: Partial<GptApiConfig>, retryConfig = RETRY_CONFIG): GptClient {
  return new GptClient(config, retryConfig);
}

// Example usage:
// const gptClient = createGptClient({ temperature: 0.8 });
// const variations = await gptClient.generateVariations({
//   phrase: "Turn on the lights",
//   intent: "LIGHTS_ON",
//   count: 5,
//   language: "english"
// });
// console.log(variations);