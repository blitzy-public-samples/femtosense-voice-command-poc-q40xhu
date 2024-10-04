/**
 * @file narakeet-client.test.ts
 * @description Test suite for the NarakeetClient implementation, ensuring robust and reliable
 * Text-to-Speech API integration for the Femtosense Voice Command Generation system.
 *
 * Requirements addressed:
 * - Audio Dataset Creation (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
 * - Multi-language Support (Technical Specification/1.1 SYSTEM OBJECTIVES/1)
 * - API Integration Testing (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 */

import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { NarakeetClient, createNarakeetClient } from '../../src/narakeet/narakeet-client';
import { NarakeetTTSResponse, NarakeetVoiceProfile, NarakeetClientConfig } from '../../src/narakeet/narakeet-types';
import { NARAKEET_CONFIG, NARAKEET_TTS_ENDPOINT, NARAKEET_VOICES_ENDPOINT } from '../../src/narakeet/narakeet-config';
import { APIClient } from '@shared/utils/api-client';

// Mock the shared APIClient
jest.mock('@shared/utils/api-client');

describe('NarakeetClient', () => {
  let narakeetClient: NarakeetClient;
  let mockAxios: MockAdapter;
  const mockApiKey = 'test-api-key';
  const mockConfig: NarakeetClientConfig = {
    apiKey: mockApiKey,
    baseUrl: 'https://api.narakeet.com',
    timeout: 30000,
  };

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    narakeetClient = createNarakeetClient(mockConfig);
  });

  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  describe('getVoiceProfiles', () => {
    it('should retrieve voice profiles successfully', async () => {
      const mockProfiles: NarakeetVoiceProfile[] = [
        { id: 'voice1', name: 'Voice 1', language: 'en', gender: 'female' },
        { id: 'voice2', name: 'Voice 2', language: 'ko', gender: 'male' },
      ];

      mockAxios.onGet(NARAKEET_VOICES_ENDPOINT).reply(200, mockProfiles);

      const result = await narakeetClient.getVoiceProfiles();

      expect(result.success).toBe(true);
      expect(result.data.profiles).toEqual(mockProfiles);
      expect(result.requestId).toBeDefined();
    });

    it('should handle errors when retrieving voice profiles', async () => {
      mockAxios.onGet(NARAKEET_VOICES_ENDPOINT).reply(500, { error: 'Internal Server Error' });

      await expect(narakeetClient.getVoiceProfiles()).rejects.toThrow('Internal Server Error');
    });

    it('should apply language and gender filters correctly', async () => {
      const mockProfiles: NarakeetVoiceProfile[] = [
        { id: 'voice1', name: 'Voice 1', language: 'en', gender: 'female' },
      ];

      mockAxios.onGet(`${NARAKEET_VOICES_ENDPOINT}?language=en&gender=female`).reply(200, mockProfiles);

      const result = await narakeetClient.getVoiceProfiles({ language: 'en', gender: 'female' });

      expect(result.success).toBe(true);
      expect(result.data.profiles).toEqual(mockProfiles);
    });
  });

  describe('generateTTS', () => {
    const mockText = 'Hello, world!';
    const mockVoiceId = 'voice1';
    const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]); // Mock audio data

    it('should generate TTS audio successfully', async () => {
      const mockResponse: NarakeetTTSResponse = {
        success: true,
        data: {
          audioData: mockAudioData,
          duration: 1.5,
          metadata: {
            voiceId: mockVoiceId,
            sampleRate: NARAKEET_CONFIG.outputFormat.sampleRate,
            format: 'wav',
          },
        },
        requestId: 'test-request-id',
      };

      mockAxios.onPost(NARAKEET_TTS_ENDPOINT).reply(200, mockAudioData.buffer);

      const result = await narakeetClient.generateTTS({ text: mockText, voiceId: mockVoiceId });

      expect(result.success).toBe(true);
      expect(result.data.audioData).toEqual(mockAudioData);
      expect(result.data.duration).toBeCloseTo(1.5, 2);
      expect(result.data.metadata).toEqual(mockResponse.data.metadata);
      expect(result.requestId).toBeDefined();
    });

    it('should handle errors when generating TTS audio', async () => {
      mockAxios.onPost(NARAKEET_TTS_ENDPOINT).reply(400, { error: 'Invalid voice ID' });

      await expect(narakeetClient.generateTTS({ text: mockText, voiceId: 'invalid-voice' })).rejects.toThrow('Invalid voice ID');
    });

    it('should validate voice ID before making API call', async () => {
      await expect(narakeetClient.generateTTS({ text: mockText, voiceId: 'non-existent-voice' })).rejects.toThrow('Invalid voice ID');
      expect(mockAxios.history.post.length).toBe(0); // Ensure no API call was made
    });
  });

  describe('error handling', () => {
    it('should use custom error handler when set', async () => {
      const customErrorHandler = jest.fn();
      narakeetClient.setErrorHandler(customErrorHandler);

      mockAxios.onGet(NARAKEET_VOICES_ENDPOINT).reply(429, { error: 'Rate limit exceeded' });

      await expect(narakeetClient.getVoiceProfiles()).rejects.toThrow();
      expect(customErrorHandler).toHaveBeenCalledWith(expect.objectContaining({ code: 'RATE_LIMIT_EXCEEDED' }));
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed requests', async () => {
      mockAxios.onGet(NARAKEET_VOICES_ENDPOINT)
        .replyOnce(500)
        .replyOnce(500)
        .replyOnce(200, [{ id: 'voice1', name: 'Voice 1', language: 'en', gender: 'female' }]);

      const result = await narakeetClient.getVoiceProfiles();

      expect(result.success).toBe(true);
      expect(mockAxios.history.get.length).toBe(3);
    });

    it('should fail after max retries', async () => {
      mockAxios.onGet(NARAKEET_VOICES_ENDPOINT).reply(500);

      await expect(narakeetClient.getVoiceProfiles()).rejects.toThrow();
      expect(mockAxios.history.get.length).toBe(NARAKEET_CONFIG.maxRetries + 1);
    });
  });
});