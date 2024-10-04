/**
 * @file gpt-client.test.ts
 * @description A comprehensive test suite for the GPT-4o API client implementation
 * in the Femtosense Voice Command Generation system.
 *
 * Requirements addressed:
 * - API Integration Testing (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Multi-language Support Testing (Technical Specification/1.1 SYSTEM OBJECTIVES/1. Automated Voice Command Variation Generation)
 * - Error Handling Verification (Technical Specification/4.2 FRAMEWORKS AND LIBRARIES)
 */

import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { GptClient, createGptClient } from '../../src/gpt/gpt-client';
import { GptApiConfig, GptVariationRequest, GptModel } from '../../src/gpt/gpt-types';
import { RETRY_CONFIG } from '../../src/gpt/gpt-config';
import { ApiResponse } from '@shared/interfaces/api-response.interface';
import { Intent } from '@shared/types/intent.types';

// Mock the logger to prevent console output during tests
jest.mock('@shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('GptClient', () => {
  let gptClient: GptClient;
  let mockAxios: MockAdapter;

  const mockSuccessResponse: ApiResponse<any> = {
    success: true,
    data: {
      choices: [
        { text: '조명 켜주세요' },
        { text: '불빛 좀 켜줄래요' },
        { text: '방 밝게 해주세요' },
      ],
      originalPhrase: '불 켜줘',
      intent: 'LIGHTS_ON',
    },
    requestId: 'test-request-id',
  };

  const mockErrorResponse = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    },
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create a new instance of GptClient with mock configuration
    const mockConfig: Partial<GptApiConfig> = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.openai.com/v1',
      model: GptModel.GPT4,
    };
    gptClient = createGptClient(mockConfig, RETRY_CONFIG);

    // Create a new instance of MockAdapter for axios
    mockAxios = new MockAdapter(axios);
  });

  test('generateVariations - successful request', async () => {
    // Arrange
    const request: GptVariationRequest = {
      phrase: '불 켜줘',
      intent: Intent.LIGHTS_ON,
      count: 3,
      language: 'korean',
    };
    mockAxios.onPost().reply(200, mockSuccessResponse);

    // Act
    const response = await gptClient.generateVariations(request);

    // Assert
    expect(response.success).toBe(true);
    expect(response.data.variations).toHaveLength(3);
    expect(response.data.variations).toContain('조명 켜주세요');
    expect(response.data.originalPhrase).toBe('불 켜줘');
    expect(response.data.intent).toBe(Intent.LIGHTS_ON);
    expect(response.requestId).toBe('test-request-id');
  });

  test('generateVariations - handles API error', async () => {
    // Arrange
    const request: GptVariationRequest = {
      phrase: '불 켜줘',
      intent: Intent.LIGHTS_ON,
      count: 3,
      language: 'korean',
    };
    mockAxios.onPost().reply(429, mockErrorResponse);

    // Act & Assert
    await expect(gptClient.generateVariations(request)).rejects.toThrow('Too many requests');
  });

  test('generateVariations - retries on failure', async () => {
    // Arrange
    const request: GptVariationRequest = {
      phrase: '불 켜줘',
      intent: Intent.LIGHTS_ON,
      count: 3,
      language: 'korean',
    };
    mockAxios
      .onPost()
      .replyOnce(500, { error: 'Internal Server Error' })
      .onPost()
      .replyOnce(429, mockErrorResponse)
      .onPost()
      .reply(200, mockSuccessResponse);

    // Act
    const response = await gptClient.generateVariations(request);

    // Assert
    expect(response.success).toBe(true);
    expect(mockAxios.history.post).toHaveLength(3); // Verify that it retried twice
    expect(response.data.variations).toHaveLength(3);
  });

  test('updateConfig - updates client configuration', () => {
    // Arrange
    const newConfig: Partial<GptApiConfig> = {
      model: GptModel.GPT3_5_TURBO,
      temperature: 0.8,
    };

    // Act
    gptClient.updateConfig(newConfig);
    const updatedConfig = gptClient.getConfig();

    // Assert
    expect(updatedConfig.model).toBe(GptModel.GPT3_5_TURBO);
    expect(updatedConfig.temperature).toBe(0.8);
  });

  test('generateVariations - handles multi-language support', async () => {
    // Arrange
    const requests: GptVariationRequest[] = [
      { phrase: '불 켜줘', intent: Intent.LIGHTS_ON, count: 2, language: 'korean' },
      { phrase: 'Turn on the lights', intent: Intent.LIGHTS_ON, count: 2, language: 'english' },
      { phrase: '電気をつけて', intent: Intent.LIGHTS_ON, count: 2, language: 'japanese' },
    ];

    const mockResponses = [
      { ...mockSuccessResponse, data: { ...mockSuccessResponse.data, choices: [{ text: '조명 켜주세요' }, { text: '불빛 좀 켜줄래요' }] } },
      { ...mockSuccessResponse, data: { ...mockSuccessResponse.data, choices: [{ text: 'Switch on the lights' }, { text: 'Illuminate the room' }] } },
      { ...mockSuccessResponse, data: { ...mockSuccessResponse.data, choices: [{ text: 'ライトをオンにして' }, { text: '部屋を明るくして' }] } },
    ];

    mockAxios.onPost().reply((config) => {
      const requestData = JSON.parse(config.data);
      const languageIndex = requests.findIndex(req => req.language === requestData.prompt.split('\n')[2].split(': ')[1]);
      return [200, mockResponses[languageIndex]];
    });

    // Act
    const responses = await Promise.all(requests.map(req => gptClient.generateVariations(req)));

    // Assert
    responses.forEach((response, index) => {
      expect(response.success).toBe(true);
      expect(response.data.variations).toHaveLength(2);
      expect(response.data.variations[0]).toBe(mockResponses[index].data.choices[0].text);
      expect(response.data.intent).toBe(Intent.LIGHTS_ON);
    });
  });

  test('generateVariations - handles invalid API response', async () => {
    // Arrange
    const request: GptVariationRequest = {
      phrase: '불 켜줘',
      intent: Intent.LIGHTS_ON,
      count: 3,
      language: 'korean',
    };
    const invalidResponse = { success: true, data: { invalid: 'structure' } };
    mockAxios.onPost().reply(200, invalidResponse);

    // Act & Assert
    await expect(gptClient.generateVariations(request)).rejects.toThrow('Invalid GPT API response structure');
  });

  test('generateVariations - respects maxTokens configuration', async () => {
    // Arrange
    const request: GptVariationRequest = {
      phrase: '불 켜줘',
      intent: Intent.LIGHTS_ON,
      count: 3,
      language: 'korean',
    };
    const customConfig: Partial<GptApiConfig> = {
      maxTokens: 500,
    };
    gptClient.updateConfig(customConfig);

    mockAxios.onPost().reply((config) => {
      const requestData = JSON.parse(config.data);
      expect(requestData.max_tokens).toBe(500);
      return [200, mockSuccessResponse];
    });

    // Act
    await gptClient.generateVariations(request);

    // Assert
    expect(mockAxios.history.post[0].data).toContain('"max_tokens":500');
  });

  test('generateVariations - handles network errors', async () => {
    // Arrange
    const request: GptVariationRequest = {
      phrase: '불 켜줘',
      intent: Intent.LIGHTS_ON,
      count: 3,
      language: 'korean',
    };
    mockAxios.onPost().networkError();

    // Act & Assert
    await expect(gptClient.generateVariations(request)).rejects.toThrow('Network Error');
  });

  test('generateVariations - handles timeout', async () => {
    // Arrange
    const request: GptVariationRequest = {
      phrase: '불 켜줘',
      intent: Intent.LIGHTS_ON,
      count: 3,
      language: 'korean',
    };
    mockAxios.onPost().timeout();

    // Act & Assert
    await expect(gptClient.generateVariations(request)).rejects.toThrow('timeout of 0ms exceeded');
  });
});