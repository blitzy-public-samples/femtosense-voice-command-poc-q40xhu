/**
 * @file audio-generator.service.ts
 * @description Service module that orchestrates the generation of audio files from text
 * using the Narakeet TTS API, managing the entire process of audio creation for voice
 * commands in the Femtosense Voice Command Generation system.
 *
 * Requirements addressed:
 * - High-Quality Audio Dataset Creation (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
 * - Multiple Voice Profiles (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
 * - Audio Quality Consistency (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
 */

import { NarakeetClient, createNarakeetClient } from '../narakeet/narakeet-client';
import { withApiRetry } from '../utils/retry-mechanism';
import { VoiceCommand, VoiceCommandAudioFile } from '@shared/interfaces/voice-command.interface';
import { logger } from '@shared/utils/logger';
import { NARAKEET_CONFIG } from '../narakeet/narakeet-config';
import { GenerateTTSParams } from '../narakeet/narakeet-types';

export class AudioGeneratorService {
  private narakeetClient: NarakeetClient;

  /**
   * Initializes the AudioGeneratorService with a Narakeet API key
   * @param apiKey - The API key for Narakeet TTS service
   */
  constructor(apiKey: string) {
    this.narakeetClient = createNarakeetClient({ apiKey, timeout: NARAKEET_CONFIG.timeout });
  }

  /**
   * Generates audio files for a voice command using multiple voice profiles.
   * @param command - The voice command to generate audio for
   * @param voiceProfiles - Array of voice profile IDs to use for generation
   * @returns Promise resolving to an array of generated audio files
   */
  public async generateAudioForCommand(command: VoiceCommand, voiceProfiles: string[]): Promise<VoiceCommandAudioFile[]> {
    logger.info(`Generating audio for command: ${command.intent}`, { commandId: command.id });

    const audioFiles: VoiceCommandAudioFile[] = [];

    for (const variation of command.variations) {
      for (const voiceProfile of voiceProfiles) {
        try {
          const audioFile = await this.generateAudioForVariation(variation, voiceProfile);
          audioFiles.push(audioFile);
        } catch (error) {
          logger.error(`Failed to generate audio for variation: ${variation}`, {
            error,
            commandId: command.id,
            voiceProfile
          });
        }
      }
    }

    logger.info(`Generated ${audioFiles.length} audio files for command: ${command.intent}`, {
      commandId: command.id,
      totalVariations: command.variations.length,
      totalVoiceProfiles: voiceProfiles.length
    });

    return audioFiles;
  }

  /**
   * Generates an audio file for a specific command variation using a single voice profile.
   * @param variation - The text variation of the command
   * @param voiceProfile - The voice profile ID to use for generation
   * @returns Promise resolving to a VoiceCommandAudioFile object
   */
  private async generateAudioForVariation(variation: string, voiceProfile: string): Promise<VoiceCommandAudioFile> {
    logger.debug(`Generating audio for variation: "${variation}" with voice profile: ${voiceProfile}`);

    const params: GenerateTTSParams = {
      text: variation,
      voiceId: voiceProfile
    };

    try {
      const result = await withApiRetry(() => this.narakeetClient.generateTTS(params));

      if (!result.success) {
        throw new Error('TTS generation failed');
      }

      const audioFile: VoiceCommandAudioFile = {
        audioData: result.data.audioData,
        duration: result.data.duration,
        voiceProfile,
        metadata: {
          ...result.data.metadata,
          text: variation,
          requestId: result.requestId
        }
      };

      if (!this.validateAudioQuality(audioFile)) {
        throw new Error('Generated audio failed quality validation');
      }

      return audioFile;
    } catch (error) {
      logger.error(`Error generating audio for variation: "${variation}"`, {
        error,
        voiceProfile
      });
      throw error;
    }
  }

  /**
   * Validates the quality of a generated audio file against system requirements.
   * @param audioFile - The generated audio file to validate
   * @returns boolean indicating whether the audio file meets quality standards
   */
  private validateAudioQuality(audioFile: VoiceCommandAudioFile): boolean {
    // Check audio duration
    if (audioFile.duration < NARAKEET_CONFIG.minAudioDuration || audioFile.duration > NARAKEET_CONFIG.maxAudioDuration) {
      logger.warn(`Audio duration out of acceptable range: ${audioFile.duration}s`, {
        voiceProfile: audioFile.voiceProfile,
        text: audioFile.metadata.text
      });
      return false;
    }

    // Verify audio format
    if (audioFile.metadata.format !== 'wav') {
      logger.warn(`Unexpected audio format: ${audioFile.metadata.format}`, {
        voiceProfile: audioFile.voiceProfile,
        text: audioFile.metadata.text
      });
      return false;
    }

    // Check sample rate
    if (audioFile.metadata.sampleRate !== NARAKEET_CONFIG.outputFormat.sampleRate) {
      logger.warn(`Unexpected sample rate: ${audioFile.metadata.sampleRate}`, {
        voiceProfile: audioFile.voiceProfile,
        text: audioFile.metadata.text
      });
      return false;
    }

    // Additional quality checks can be implemented here, such as:
    // - Signal-to-noise ratio analysis
    // - Loudness normalization check
    // - Clipping detection

    return true;
  }
}