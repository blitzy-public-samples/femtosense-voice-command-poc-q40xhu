import { logger } from '../utils/logger';
import { encryptApiKey, decryptApiKey, SecureAPIClient } from '../utils/security';
import { isValidLanguageCode, validatePhrase } from '../utils/validators';
import { APIClient } from '../utils/api-client';
import { fileManager } from '../utils/file-manager';
import { LanguageCode } from '../types/language.types';
import { IntentType } from '../types/intent.types';
import { AudioFileMetadata } from '../interfaces/file-storage.interface';
import { mocked } from 'jest-mock';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Mock external dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('axios');
jest.mock('fs/promises');

describe('Utility Functions Tests', () => {
  // Logger Tests
  describe('Logger', () => {
    it('should create log entries at different levels', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG'));

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      logger.error('Error occurred', new Error('Test error'));

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error occurred'));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));

      errorSpy.mockRestore();
    });
  });

  // Security Utility Tests
  describe('Security Utilities', () => {
    const testApiKey = 'test-api-key-12345';

    it('should encrypt and decrypt API key correctly', () => {
      const encryptedKey = encryptApiKey(testApiKey);
      expect(encryptedKey).not.toBe(testApiKey);

      const decryptedKey = decryptApiKey(encryptedKey);
      expect(decryptedKey).toBe(testApiKey);
    });

    it('should make secure API requests', async () => {
      const secureClient = new SecureAPIClient(testApiKey);
      const mockResponse = { data: 'test data' };
      
      // Mock the fetch function
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const response = await secureClient.request('https://api.example.com', 'GET');
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-api-key': expect.any(String),
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  // Validator Tests
  describe('Validator Utilities', () => {
    it('should validate language codes correctly', () => {
      expect(isValidLanguageCode('korean')).toBe(true);
      expect(isValidLanguageCode('english')).toBe(true);
      expect(isValidLanguageCode('japanese')).toBe(true);
      expect(isValidLanguageCode('french')).toBe(false);
    });

    it('should validate phrases based on language', () => {
      expect(validatePhrase('안녕하세요', 'korean')).toBe(true);
      expect(validatePhrase('Hello world', 'english')).toBe(true);
      expect(validatePhrase('こんにちは', 'japanese')).toBe(true);
      expect(validatePhrase('Invalid123', 'english')).toBe(false);
    });
  });

  // API Client Tests
  describe('API Client', () => {
    const mockApiKey = 'mock-api-key';
    let apiClient: APIClient;

    beforeEach(() => {
      apiClient = new APIClient(mockApiKey);
      mocked(axios.request).mockClear();
    });

    it('should handle successful API requests', async () => {
      const mockResponse = { data: ['variation1', 'variation2'] };
      mocked(axios.request).mockResolvedValue(mockResponse);

      const response = await apiClient.generateVariations('Turn on the lights', 2);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(['variation1', 'variation2']);
      expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.stringContaining('/variations'),
        method: 'POST',
        data: expect.objectContaining({
          prompt: expect.stringContaining('Turn on the lights'),
          max_tokens: 1000
        })
      }));
    });

    it('should handle API errors correctly', async () => {
      const mockError = new Error('API Error');
      mocked(axios.request).mockRejectedValue(mockError);

      const response = await apiClient.generateVariations('Turn on the lights', 2);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('API Error');
    });
  });

  // File Manager Tests
  describe('File Manager', () => {
    const mockS3Client = mocked(S3Client);
    const mockPutObject = mocked(PutObjectCommand);
    const mockGetObject = mocked(GetObjectCommand);
    const mockDeleteObject = mocked(DeleteObjectCommand);
    const mockListObjects = mocked(ListObjectsV2Command);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should save audio file to both local storage and S3', async () => {
      const mockAudioData = Buffer.from('mock audio data');
      const mockMetadata: AudioFileMetadata = {
        intent: IntentType.LIGHTS_ON,
        language: LanguageCode.KOREAN,
        voiceProfile: 'profile1',
        phrase: '불 켜줘',
        variation: 'variation1',
        duration: 2.5,
        sampleRate: 44100,
        createdAt: new Date().toISOString()
      };

      mockS3Client.prototype.send.mockResolvedValue({});
      mocked(fs.writeFile).mockResolvedValue();

      const result = await fileManager.saveAudioFile(mockAudioData, mockMetadata);

      expect(result).toContain('korean/LIGHTS_ON/variation1/profile1.wav');
      expect(fs.writeFile).toHaveBeenCalled();
      expect(mockS3Client.prototype.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should retrieve audio file from S3', async () => {
      const mockAudioData = Buffer.from('mock audio data');
      mockS3Client.prototype.send.mockResolvedValue({
        Body: {
          transformToByteArray: jest.fn().mockResolvedValue(mockAudioData)
        }
      });

      const result = await fileManager.getAudioFile('korean/LIGHTS_ON/variation1/profile1.wav');

      expect(result).toEqual(mockAudioData);
      expect(mockS3Client.prototype.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should delete audio file from both S3 and local storage', async () => {
      mockS3Client.prototype.send.mockResolvedValue({});
      mocked(fs.unlink).mockResolvedValue();

      await fileManager.deleteAudioFile('korean/LIGHTS_ON/variation1/profile1.wav');

      expect(mockS3Client.prototype.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should list audio files for a given intent and language', async () => {
      const mockFiles = [
        { Key: 'korean/LIGHTS_ON/variation1/profile1.wav' },
        { Key: 'korean/LIGHTS_ON/variation2/profile2.wav' }
      ];
      mockS3Client.prototype.send.mockResolvedValue({
        Contents: mockFiles,
        IsTruncated: false
      });

      const result = await fileManager.listAudioFiles(IntentType.LIGHTS_ON, LanguageCode.KOREAN);

      expect(result).toEqual(mockFiles.map(file => file.Key));
      expect(mockS3Client.prototype.send).toHaveBeenCalledWith(expect.any(ListObjectsV2Command));
    });
  });
});