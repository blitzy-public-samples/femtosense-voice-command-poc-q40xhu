/**
 * @file audio-generator.test.ts
 * @description A comprehensive test suite for the AudioGeneratorService, ensuring reliable
 * and consistent audio generation functionality in the Femtosense Voice Command Generation system.
 *
 * Requirements addressed:
 * - Audio Quality Assurance (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
 * - Multiple Voice Profiles (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
 * - Error Handling (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 */

import { AudioGeneratorService } from '../../src/services/audio-generator.service';
import { VoiceCommand, VoiceCommandAudioFile } from '@shared/interfaces/voice-command.interface';
import { NarakeetClient } from '../../src/narakeet/narakeet-client';
import { NARAKEET_CONFIG } from '../../src/narakeet/narakeet-config';
import { logger } from '@shared/utils/logger';

// Mock dependencies
jest.mock('../../src/narakeet/narakeet-client');
jest.mock('@shared/utils/logger');

describe('AudioGeneratorService', () => {
  let audioGeneratorService: AudioGeneratorService;
  let mockNarakeetClient: jest.Mocked<NarakeetClient>;
  const mockApiKey = 'test-api-key';

  const mockVoiceCommand: VoiceCommand = {
    id: 'cmd-001',
    intent: 'LIGHTS_ON',
    variations: ['Turn on the lights', 'Lights on please']
  };

  const mockVoiceProfiles = ['voice-1', 'voice-2'];

  beforeEach(() => {
    mockNarakeetClient = {
      generateTTS: jest.fn()
    } as unknown as jest.Mocked<NarakeetClient>;

    (NarakeetClient as jest.Mock).mockImplementation(() => mockNarakeetClient);

    audioGeneratorService = new AudioGeneratorService(mockApiKey);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAudioForCommand', () => {
    it('should generate audio files for all variations and voice profiles', async () => {
      const mockAudioFile: VoiceCommandAudioFile = {
        audioData: Buffer.from('mock-audio-data'),
        duration: 1.5,
        voiceProfile: 'voice-1',
        metadata: {
          format: 'wav',
          sampleRate: NARAKEET_CONFIG.outputFormat.sampleRate,
          text: 'Turn on the lights',
          requestId: 'req-001'
        }
      };

      mockNarakeetClient.generateTTS.mockResolvedValue({
        success: true,
        data: {
          audioData: mockAudioFile.audioData,
          duration: mockAudioFile.duration,
          metadata: mockAudioFile.metadata
        },
        requestId: 'req-001'
      });

      const result = await audioGeneratorService.generateAudioForCommand(mockVoiceCommand, mockVoiceProfiles);

      expect(result.length).toBe(mockVoiceCommand.variations.length * mockVoiceProfiles.length);
      expect(mockNarakeetClient.generateTTS).toHaveBeenCalledTimes(mockVoiceCommand.variations.length * mockVoiceProfiles.length);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Generated ${result.length} audio files for command: ${mockVoiceCommand.intent}`),
        expect.any(Object)
      );
    });

    it('should handle partial failures and continue processing', async () => {
      mockNarakeetClient.generateTTS
        .mockResolvedValueOnce({
          success: true,
          data: {
            audioData: Buffer.from('mock-audio-data'),
            duration: 1.5,
            metadata: {
              format: 'wav',
              sampleRate: NARAKEET_CONFIG.outputFormat.sampleRate,
              text: 'Turn on the lights',
              requestId: 'req-001'
            }
          },
          requestId: 'req-001'
        })
        .mockRejectedValueOnce(new Error('API Error'));

      const result = await audioGeneratorService.generateAudioForCommand(mockVoiceCommand, mockVoiceProfiles);

      expect(result.length).toBe(1);
      expect(mockNarakeetClient.generateTTS).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to generate audio for variation'), expect.any(Object));
    });
  });

  describe('generateAudioForVariation', () => {
    it('should generate audio for a single variation and voice profile', async () => {
      const mockVariation = 'Turn on the lights';
      const mockVoiceProfile = 'voice-1';
      const mockAudioFile: VoiceCommandAudioFile = {
        audioData: Buffer.from('mock-audio-data'),
        duration: 1.5,
        voiceProfile: mockVoiceProfile,
        metadata: {
          format: 'wav',
          sampleRate: NARAKEET_CONFIG.outputFormat.sampleRate,
          text: mockVariation,
          requestId: 'req-001'
        }
      };

      mockNarakeetClient.generateTTS.mockResolvedValue({
        success: true,
        data: {
          audioData: mockAudioFile.audioData,
          duration: mockAudioFile.duration,
          metadata: mockAudioFile.metadata
        },
        requestId: 'req-001'
      });

      const result = await (audioGeneratorService as any).generateAudioForVariation(mockVariation, mockVoiceProfile);

      expect(result).toEqual(mockAudioFile);
      expect(mockNarakeetClient.generateTTS).toHaveBeenCalledWith({
        text: mockVariation,
        voiceId: mockVoiceProfile
      });
    });

    it('should throw an error if TTS generation fails', async () => {
      mockNarakeetClient.generateTTS.mockResolvedValue({
        success: false,
        error: 'TTS generation failed',
        requestId: 'req-001'
      });

      await expect((audioGeneratorService as any).generateAudioForVariation('Test', 'voice-1'))
        .rejects.toThrow('TTS generation failed');
    });
  });

  describe('validateAudioQuality', () => {
    it('should validate audio quality successfully', () => {
      const mockAudioFile: VoiceCommandAudioFile = {
        audioData: Buffer.from('mock-audio-data'),
        duration: 1.5,
        voiceProfile: 'voice-1',
        metadata: {
          format: 'wav',
          sampleRate: NARAKEET_CONFIG.outputFormat.sampleRate,
          text: 'Turn on the lights',
          requestId: 'req-001'
        }
      };

      const result = (audioGeneratorService as any).validateAudioQuality(mockAudioFile);
      expect(result).toBe(true);
    });

    it('should fail validation for incorrect audio duration', () => {
      const mockAudioFile: VoiceCommandAudioFile = {
        audioData: Buffer.from('mock-audio-data'),
        duration: 0.1, // Too short
        voiceProfile: 'voice-1',
        metadata: {
          format: 'wav',
          sampleRate: NARAKEET_CONFIG.outputFormat.sampleRate,
          text: 'Turn on the lights',
          requestId: 'req-001'
        }
      };

      const result = (audioGeneratorService as any).validateAudioQuality(mockAudioFile);
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Audio duration out of acceptable range'), expect.any(Object));
    });

    it('should fail validation for incorrect audio format', () => {
      const mockAudioFile: VoiceCommandAudioFile = {
        audioData: Buffer.from('mock-audio-data'),
        duration: 1.5,
        voiceProfile: 'voice-1',
        metadata: {
          format: 'mp3', // Incorrect format
          sampleRate: NARAKEET_CONFIG.outputFormat.sampleRate,
          text: 'Turn on the lights',
          requestId: 'req-001'
        }
      };

      const result = (audioGeneratorService as any).validateAudioQuality(mockAudioFile);
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unexpected audio format'), expect.any(Object));
    });

    it('should fail validation for incorrect sample rate', () => {
      const mockAudioFile: VoiceCommandAudioFile = {
        audioData: Buffer.from('mock-audio-data'),
        duration: 1.5,
        voiceProfile: 'voice-1',
        metadata: {
          format: 'wav',
          sampleRate: 22050, // Incorrect sample rate
          text: 'Turn on the lights',
          requestId: 'req-001'
        }
      };

      const result = (audioGeneratorService as any).validateAudioQuality(mockAudioFile);
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unexpected sample rate'), expect.any(Object));
    });
  });
});