/**
 * @file variation-generator.service.ts
 * @description Service module that orchestrates the generation of voice command variations
 * using the GPT-4o API, ensuring semantic consistency and handling multiple languages.
 *
 * Requirements addressed:
 * - Automated Variation Generation (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 * - Multi-language Support (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 * - Intent Preservation (Technical Specification/1.2.1 Core Functionalities)
 */

import { injectable, inject } from 'inversify';
import { GptClient } from '../gpt/gpt-client';
import { VoiceCommand, VoiceCommandVariation } from '@shared/interfaces/voice-command.interface';
import { withRetry } from '../utils/retry-mechanism';
import { validatePhrase, isValidLanguageCode } from '@shared/utils/validators';
import { logger } from '@shared/utils/logger';
import { TYPES } from '../types';
import { ApiError } from '@shared/errors/custom-errors';

@injectable()
export class VariationGeneratorService {
  private readonly MAX_VARIATIONS = 50;
  private readonly MIN_VARIATIONS = 5;

  constructor(
    @inject(TYPES.GptClient) private gptClient: GptClient
  ) {}

  /**
   * Generates and validates variations for a given voice command.
   * @param command - The original voice command
   * @returns Promise<VoiceCommandVariation[]> - Array of generated and validated voice command variations
   */
  public async generateVariations(command: VoiceCommand): Promise<VoiceCommandVariation[]> {
    logger.info('Generating variations for voice command', { commandId: command.id, phrase: command.phrase });

    if (!isValidLanguageCode(command.language)) {
      throw new ApiError('Invalid language code', 400);
    }

    const validatedPhrase = validatePhrase(command.phrase);
    if (!validatedPhrase) {
      throw new ApiError('Invalid voice command phrase', 400);
    }

    const generatedVariations = await this.callGptApi(command);
    const validatedVariations = this.validateVariations(generatedVariations, command);

    logger.info('Variations generated and validated', { 
      commandId: command.id, 
      generatedCount: generatedVariations.length, 
      validCount: validatedVariations.length 
    });

    return validatedVariations;
  }

  /**
   * Calls the GPT API to generate variations with retry mechanism.
   * @param command - The original voice command
   * @returns Promise<string[]> - Array of generated variations
   */
  private async callGptApi(command: VoiceCommand): Promise<string[]> {
    const generateWithRetry = withRetry(async () => {
      const response = await this.gptClient.generateVariations({
        phrase: command.phrase,
        intent: command.intent,
        count: this.MAX_VARIATIONS,
        language: command.language
      });
      return response.data.variations;
    }, { maxRetries: 3, baseDelay: 1000, maxDelay: 5000 });

    try {
      return await generateWithRetry();
    } catch (error) {
      logger.error('Failed to generate variations after retries', { error, commandId: command.id });
      throw new ApiError('Failed to generate variations', 500);
    }
  }

  /**
   * Validates generated variations for semantic consistency and language correctness.
   * @param variations - Array of generated variations
   * @param originalCommand - The original voice command
   * @returns VoiceCommandVariation[] - Array of validated variations
   */
  private validateVariations(variations: string[], originalCommand: VoiceCommand): VoiceCommandVariation[] {
    const validatedVariations: VoiceCommandVariation[] = [];

    for (const variation of variations) {
      if (this.isValidVariation(variation, originalCommand)) {
        validatedVariations.push({
          id: this.generateUniqueId(),
          phrase: variation,
          audioFiles: []
        });
      }

      if (validatedVariations.length >= this.MAX_VARIATIONS) {
        break;
      }
    }

    if (validatedVariations.length < this.MIN_VARIATIONS) {
      logger.warn('Insufficient valid variations generated', { 
        commandId: originalCommand.id, 
        validCount: validatedVariations.length 
      });
      throw new ApiError('Insufficient valid variations generated', 500);
    }

    return validatedVariations;
  }

  /**
   * Checks if a variation is valid based on language correctness and semantic consistency.
   * @param variation - The variation to validate
   * @param originalCommand - The original voice command
   * @returns boolean - True if the variation is valid, false otherwise
   */
  private isValidVariation(variation: string, originalCommand: VoiceCommand): boolean {
    // Implement more sophisticated validation logic here
    // This could include NLP techniques, similarity scoring, etc.
    const isLanguageCorrect = validatePhrase(variation, originalCommand.language);
    const isSemanticallyConsistent = this.checkSemanticConsistency(variation, originalCommand);
    const isUnique = !originalCommand.variations.some(v => v.phrase.toLowerCase() === variation.toLowerCase());

    return isLanguageCorrect && isSemanticallyConsistent && isUnique;
  }

  /**
   * Checks semantic consistency between a variation and the original command.
   * @param variation - The variation to check
   * @param originalCommand - The original voice command
   * @returns boolean - True if semantically consistent, false otherwise
   */
  private checkSemanticConsistency(variation: string, originalCommand: VoiceCommand): boolean {
    // Implement semantic consistency check
    // This could involve using the GPT model for comparison or other NLP techniques
    // For now, we'll use a simple check based on common words
    const originalWords = new Set(originalCommand.phrase.toLowerCase().split(' '));
    const variationWords = new Set(variation.toLowerCase().split(' '));
    const commonWords = new Set([...originalWords].filter(x => variationWords.has(x)));

    return commonWords.size >= Math.min(originalWords.size, variationWords.size) * 0.5;
  }

  /**
   * Generates a unique identifier for each variation.
   * @returns string - A unique identifier
   */
  private generateUniqueId(): string {
    return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const createVariationGeneratorService = (gptClient: GptClient): VariationGeneratorService => {
  return new VariationGeneratorService(gptClient);
};