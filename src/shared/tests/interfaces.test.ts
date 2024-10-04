/**
 * @file interfaces.test.ts
 * @description A comprehensive test suite for validating the TypeScript interfaces used throughout the Femtosense Voice Command Generation system,
 * ensuring type safety and correct implementation of interface contracts.
 * 
 * Requirements addressed:
 * - Interface Validation (Technical Specification/3.5 CI/CD PIPELINE)
 * - Type Safety (Technical Specification/3.3 COMPONENT DETAILS)
 * - Data Structure Integrity (Technical Specification/2.2 DATABASE DESIGN)
 */

import { expect, describe, it } from 'jest';
import { ApiResponse, ApiError, HttpStatusCode, createSuccessResponse, createErrorResponse } from '../interfaces/api-response.interface';
import { IFileStorage, AudioFileMetadata } from '../interfaces/file-storage.interface';
import { VoiceCommand, VoiceCommandVariation, VoiceCommandAudioFile } from '../interfaces/voice-command.interface';
import { Intent } from '../types/intent.types';
import { Language } from '../types/language.types';

describe('API Response Interface Tests', () => {
  it('should create a valid success response', () => {
    const data = { message: 'Test successful' };
    const requestId = '123456';
    const response = createSuccessResponse(data, requestId);

    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
    expect(response.requestId).toBe(requestId);
    expect(response.timestamp).toBeDefined();
    expect(response.error).toBeUndefined();
  });

  it('should create a valid error response', () => {
    const error: ApiError = {
      code: HttpStatusCode.BAD_REQUEST,
      message: 'Invalid input'
    };
    const requestId = '654321';
    const response = createErrorResponse(error, requestId);

    expect(response.success).toBe(false);
    expect(response.error).toEqual(error);
    expect(response.requestId).toBe(requestId);
    expect(response.timestamp).toBeDefined();
    expect(response.data).toBeUndefined();
  });

  it('should have correct types for generic data', () => {
    interface TestData {
      id: number;
      name: string;
    }

    const response: ApiResponse<TestData> = {
      success: true,
      data: { id: 1, name: 'Test' },
      timestamp: new Date().toISOString(),
      requestId: '123'
    };

    expect(response.data?.id).toBe(1);
    expect(response.data?.name).toBe('Test');
  });
});

describe('File Storage Interface Tests', () => {
  const mockFileStorage: IFileStorage = {
    saveAudioFile: jest.fn(),
    getAudioFile: jest.fn(),
    deleteAudioFile: jest.fn(),
    listAudioFiles: jest.fn()
  };

  it('should have correct method signatures', () => {
    expect(typeof mockFileStorage.saveAudioFile).toBe('function');
    expect(typeof mockFileStorage.getAudioFile).toBe('function');
    expect(typeof mockFileStorage.deleteAudioFile).toBe('function');
    expect(typeof mockFileStorage.listAudioFiles).toBe('function');
  });

  it('should handle AudioFileMetadata correctly', () => {
    const metadata: AudioFileMetadata = {
      intent: 'LIGHTS_ON',
      language: 'en-US',
      voiceProfile: 'female-1',
      phrase: 'Turn on the lights',
      variation: 'Please turn on the lights'
    };

    expect(metadata.intent).toBe('LIGHTS_ON');
    expect(metadata.language).toBe('en-US');
    expect(metadata.voiceProfile).toBe('female-1');
    expect(metadata.phrase).toBe('Turn on the lights');
    expect(metadata.variation).toBe('Please turn on the lights');
  });
});

describe('Voice Command Interface Tests', () => {
  it('should create a valid VoiceCommand object', () => {
    const voiceCommand: VoiceCommand = {
      id: '123',
      phrase: 'Turn on the lights',
      intent: 'LIGHTS_ON',
      language: 'en-US',
      variations: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDistractor: false
      }
    };

    expect(voiceCommand.id).toBe('123');
    expect(voiceCommand.phrase).toBe('Turn on the lights');
    expect(voiceCommand.intent).toBe('LIGHTS_ON');
    expect(voiceCommand.language).toBe('en-US');
    expect(Array.isArray(voiceCommand.variations)).toBe(true);
    expect(voiceCommand.metadata.isDistractor).toBe(false);
  });

  it('should create a valid VoiceCommandVariation object', () => {
    const variation: VoiceCommandVariation = {
      id: '456',
      phrase: 'Please turn on the lights',
      audioFiles: []
    };

    expect(variation.id).toBe('456');
    expect(variation.phrase).toBe('Please turn on the lights');
    expect(Array.isArray(variation.audioFiles)).toBe(true);
  });

  it('should create a valid VoiceCommandAudioFile object', () => {
    const audioFile: VoiceCommandAudioFile = {
      id: '789',
      voiceProfile: 'female-1',
      fileUrl: 'https://example.com/audio/789.wav',
      format: 'WAV',
      metadata: {
        duration: 2.5,
        sampleRate: 44100,
        createdAt: new Date().toISOString()
      }
    };

    expect(audioFile.id).toBe('789');
    expect(audioFile.voiceProfile).toBe('female-1');
    expect(audioFile.fileUrl).toBe('https://example.com/audio/789.wav');
    expect(audioFile.format).toBe('WAV');
    expect(audioFile.metadata.duration).toBe(2.5);
    expect(audioFile.metadata.sampleRate).toBe(44100);
    expect(audioFile.metadata.createdAt).toBeDefined();
  });
});

// Helper functions for creating mock objects
function createMockApiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substring(7)
  };
}

function createMockVoiceCommand(intent: Intent, language: Language): VoiceCommand {
  return {
    id: Math.random().toString(36).substring(7),
    phrase: 'Mock voice command',
    intent,
    language,
    variations: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDistractor: false
    }
  };
}

function createMockAudioFileMetadata(intent: Intent, language: Language): AudioFileMetadata {
  return {
    intent,
    language,
    voiceProfile: 'mock-voice',
    phrase: 'Mock phrase',
    variation: 'Mock variation'
  };
}

describe('Interface Integration Tests', () => {
  it('should integrate ApiResponse with VoiceCommand', () => {
    const mockCommand = createMockVoiceCommand('LIGHTS_ON', 'en-US');
    const response = createMockApiResponse(mockCommand);

    expect(response.success).toBe(true);
    expect(response.data?.id).toBeDefined();
    expect(response.data?.intent).toBe('LIGHTS_ON');
    expect(response.data?.language).toBe('en-US');
  });

  it('should integrate AudioFileMetadata with VoiceCommand', () => {
    const mockCommand = createMockVoiceCommand('VOLUME_UP', 'ko-KR');
    const mockMetadata = createMockAudioFileMetadata(mockCommand.intent, mockCommand.language);

    expect(mockMetadata.intent).toBe(mockCommand.intent);
    expect(mockMetadata.language).toBe(mockCommand.language);
  });
});