/**
 * @file variation-generator.test.ts
 * @description Test suite for the VariationGeneratorService, ensuring robust and reliable
 * voice command variation generation functionality.
 *
 * Requirements addressed:
 * - Automated Variation Generation Testing (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 * - Multi-language Support Testing (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 * - Intent Preservation Testing (Technical Specification/1.2.1 Core Functionalities)
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Mock } from 'jest-mock';
import { VariationGeneratorService } from '../../src/services/variation-generator.service';
import { GptClient } from '../../src/gpt/gpt-client';
import { VoiceCommand, VoiceCommandVariation } from '@shared/interfaces/voice-command.interface';
import { MockGptResponse } from '../../src/gpt/gpt-types';
import { ApiError } from '@shared/errors/custom-errors';

// Mock the GptClient
jest.mock('../../src/gpt/gpt-client');

describe('VariationGeneratorService', () => {
  let mockGptClient: Mock<GptClient>;
  let testService: VariationGeneratorService;

  beforeEach(() => {
    mockGptClient = new Mock<GptClient>();
    testService = new VariationGeneratorService(mockGptClient);
  });

  test('should generate variations successfully', async () => {
    // Arrange
    const mockCommand: VoiceCommand = {
      id: 'cmd_001',
      phrase: 'Turn on the lights',
      intent: 'LIGHTS_ON',
      language: 'en',
      variations: []
    };

    const mockVariations = [
      'Please turn on the lights',
      'Can you switch on the lights?',
      'Lights on, please',
      'Illuminate the room',
      'Activate the lighting'
    ];

    const mockGptResponse: MockGptResponse = {
      data: {
        variations: mockVariations
      }
    };

    mockGptClient.generateVariations.mockResolvedValue(mockGptResponse);

    // Act
    const result = await testService.generateVariations(mockCommand);

    // Assert
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('phrase');
    expect(result[0]).toHaveProperty('audioFiles');
    expect(mockGptClient.generateVariations).toHaveBeenCalledWith({
      phrase: mockCommand.phrase,
      intent: mockCommand.intent,
      count: 50,
      language: mockCommand.language
    });
  });

  test('should handle API errors gracefully', async () => {
    // Arrange
    const mockCommand: VoiceCommand = {
      id: 'cmd_002',
      phrase: 'What\'s the weather like?',
      intent: 'GET_WEATHER',
      language: 'en',
      variations: []
    };

    mockGptClient.generateVariations.mockRejectedValue(new Error('API Error'));

    // Act & Assert
    await expect(testService.generateVariations(mockCommand)).rejects.toThrow(ApiError);
    await expect(testService.generateVariations(mockCommand)).rejects.toThrow('Failed to generate variations');
  });

  test('should validate variations correctly', async () => {
    // Arrange
    const mockCommand: VoiceCommand = {
      id: 'cmd_003',
      phrase: 'Set an alarm for 7 AM',
      intent: 'SET_ALARM',
      language: 'en',
      variations: []
    };

    const mockVariations = [
      'Set an alarm for 7 AM',
      'Wake me up at 7 in the morning',
      'Set a 7 AM alarm',
      'Invalid variation',
      'Alarm for 7 AM, please'
    ];

    const mockGptResponse: MockGptResponse = {
      data: {
        variations: mockVariations
      }
    };

    mockGptClient.generateVariations.mockResolvedValue(mockGptResponse);

    // Act
    const result = await testService.generateVariations(mockCommand);

    // Assert
    expect(result).toHaveLength(4);
    expect(result.every(v => v.phrase !== 'Invalid variation')).toBe(true);
  });

  test('should support multiple languages', async () => {
    // Arrange
    const languages = ['en', 'ko', 'ja'];
    const mockCommands: VoiceCommand[] = languages.map(lang => ({
      id: `cmd_${lang}`,
      phrase: 'Turn on the lights',
      intent: 'LIGHTS_ON',
      language: lang,
      variations: []
    }));

    const mockVariations = {
      en: ['Turn on the lights', 'Switch the lights on'],
      ko: ['불 켜줘', '조명 켜주세요'],
      ja: ['電気をつけて', 'ライトをオンにして']
    };

    // Act & Assert
    for (const command of mockCommands) {
      mockGptClient.generateVariations.mockResolvedValue({
        data: {
          variations: mockVariations[command.language]
        }
      });

      const result = await testService.generateVariations(command);

      expect(result).toHaveLength(2);
      expect(result.every(v => v.phrase.length > 0)).toBe(true);
      expect(mockGptClient.generateVariations).toHaveBeenCalledWith(expect.objectContaining({
        language: command.language
      }));
    }
  });

  test('should throw error for invalid language code', async () => {
    // Arrange
    const mockCommand: VoiceCommand = {
      id: 'cmd_004',
      phrase: 'Invalid language test',
      intent: 'TEST',
      language: 'invalid',
      variations: []
    };

    // Act & Assert
    await expect(testService.generateVariations(mockCommand)).rejects.toThrow(ApiError);
    await expect(testService.generateVariations(mockCommand)).rejects.toThrow('Invalid language code');
  });

  test('should throw error for insufficient valid variations', async () => {
    // Arrange
    const mockCommand: VoiceCommand = {
      id: 'cmd_005',
      phrase: 'Insufficient variations test',
      intent: 'TEST',
      language: 'en',
      variations: []
    };

    const mockVariations = [
      'Invalid variation 1',
      'Invalid variation 2',
      'Invalid variation 3',
      'Invalid variation 4'
    ];

    const mockGptResponse: MockGptResponse = {
      data: {
        variations: mockVariations
      }
    };

    mockGptClient.generateVariations.mockResolvedValue(mockGptResponse);

    // Act & Assert
    await expect(testService.generateVariations(mockCommand)).rejects.toThrow(ApiError);
    await expect(testService.generateVariations(mockCommand)).rejects.toThrow('Insufficient valid variations generated');
  });
});