/**
 * @file narakeet-client.ts
 * @description Implements the client for interacting with the Narakeet Text-to-Speech API,
 * handling audio generation requests for the Femtosense Voice Command Generation system.
 *
 * Requirements addressed:
 * - Audio Dataset Creation (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
 * - Multi-language Support (Technical Specification/1.1 SYSTEM OBJECTIVES/1)
 * - API Integration (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 */

import {
  NarakeetTTSRequest,
  NarakeetTTSResponse,
  NarakeetVoiceProfile,
  NarakeetClientConfig,
  GetVoiceProfilesParams,
  GetVoiceProfilesResponse,
  GenerateTTSParams,
  GenerateTTSResponse,
  NarakeetErrorHandler,
} from './narakeet-types';
import { NARAKEET_CONFIG, NARAKEET_TTS_ENDPOINT, NARAKEET_VOICES_ENDPOINT, getNarakeetTtsUrl } from './narakeet-config';
import { handleNarakeetError, withNarakeetErrorHandling } from './narakeet-error-handler';
import { APIClient } from '@shared/utils/api-client';
import { API_ENDPOINTS } from '@shared/constants/api-endpoints';
import { logger } from '@shared/utils/logger';

/**
 * NarakeetClient class for interacting with the Narakeet Text-to-Speech API.
 */
export class NarakeetClient {
  private apiClient: APIClient;
  private errorHandler: NarakeetErrorHandler;

  /**
   * Creates an instance of NarakeetClient.
   * @param config - Configuration options for the Narakeet client
   */
  constructor(private config: NarakeetClientConfig) {
    this.apiClient = new APIClient(config.apiKey);
    this.errorHandler = handleNarakeetError;
  }

  /**
   * Sets a custom error handler for Narakeet API errors.
   * @param handler - Custom error handler function
   */
  public setErrorHandler(handler: NarakeetErrorHandler): void {
    this.errorHandler = handler;
  }

  /**
   * Retrieves available voice profiles from the Narakeet API.
   * @param params - Optional parameters for filtering voice profiles
   * @returns Promise resolving to the voice profiles response
   */
  @withNarakeetErrorHandling
  public async getVoiceProfiles(params?: GetVoiceProfilesParams): Promise<GetVoiceProfilesResponse> {
    logger.info('Retrieving voice profiles from Narakeet API', { params });

    const queryParams = new URLSearchParams();
    if (params?.language) queryParams.append('language', params.language);
    if (params?.gender) queryParams.append('gender', params.gender);

    const url = `${NARAKEET_VOICES_ENDPOINT}?${queryParams.toString()}`;

    try {
      const response = await this.apiClient.request<NarakeetVoiceProfile[]>(url, 'GET');
      return {
        success: true,
        data: { profiles: response.data },
        requestId: response.requestId,
      };
    } catch (error) {
      logger.error('Error retrieving voice profiles', { error });
      throw this.errorHandler(error);
    }
  }

  /**
   * Generates audio from text using the specified voice profile.
   * @param params - Parameters for TTS generation
   * @returns Promise resolving to the TTS response
   */
  @withNarakeetErrorHandling
  public async generateTTS(params: GenerateTTSParams): Promise<GenerateTTSResponse> {
    logger.info('Generating TTS audio with Narakeet API', { voiceId: params.voiceId });

    if (!this.validateVoiceId(params.voiceId)) {
      throw new Error('Invalid voice ID');
    }

    const url = getNarakeetTtsUrl(params.voiceId);

    try {
      const response = await this.apiClient.request<ArrayBuffer>(url, 'POST', params.text, {
        headers: { 'Content-Type': 'text/plain' },
        timeout: this.config.timeout,
      });

      const audioData = new Uint8Array(response.data);
      const duration = this.calculateAudioDuration(audioData);

      return {
        success: true,
        data: {
          audioData,
          duration,
          metadata: {
            voiceId: params.voiceId,
            sampleRate: NARAKEET_CONFIG.outputFormat.sampleRate,
            format: 'wav',
          },
        },
        requestId: response.requestId,
      };
    } catch (error) {
      logger.error('Error generating TTS audio', { error, params });
      throw this.errorHandler(error);
    }
  }

  /**
   * Validates if a given voice ID exists in the voice registry.
   * @param voiceId - The voice ID to validate
   * @returns boolean indicating whether the voice ID is valid
   */
  private validateVoiceId(voiceId: string): boolean {
    return Object.values(NARAKEET_CONFIG.voiceRegistry).some(voices => voices.includes(voiceId));
  }

  /**
   * Calculates the duration of the audio in seconds.
   * @param audioData - The audio data as a Uint8Array
   * @returns The duration of the audio in seconds
   */
  private calculateAudioDuration(audioData: Uint8Array): number {
    // WAV header is 44 bytes, then it's raw PCM data
    const dataSize = audioData.length - 44;
    const sampleRate = NARAKEET_CONFIG.outputFormat.sampleRate;
    const bytesPerSample = NARAKEET_CONFIG.outputFormat.bitDepth / 8;
    return dataSize / (sampleRate * bytesPerSample);
  }
}

// Export a factory function to create a new NarakeetClient instance
export function createNarakeetClient(config: NarakeetClientConfig): NarakeetClient {
  return new NarakeetClient(config);
}