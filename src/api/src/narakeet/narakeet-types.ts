/**
 * @file narakeet-types.ts
 * @description This file defines the types and interfaces specific to the Narakeet Text-to-Speech API integration
 * within the Femtosense Voice Command Generation system.
 * 
 * Requirements addressed:
 * - Audio Dataset Creation (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
 * - Multi-language Support (Technical Specification/1.1 SYSTEM OBJECTIVES/1)
 * - Define types for TTS API interaction
 * - Support type definitions for multiple languages
 */

import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { LanguageCode } from '../../shared/types/language.types';

/**
 * Defines the structure for voice profiles available in the Narakeet TTS service.
 */
export interface NarakeetVoiceProfile {
  /** Unique identifier for the voice profile */
  id: string;
  /** Human-readable name of the voice profile */
  name: string;
  /** Language code of the voice profile */
  language: LanguageCode;
  /** Gender of the voice profile */
  gender: 'male' | 'female';
  /** Optional accent information for the voice profile */
  accent?: string;
}

/**
 * Defines the structure for TTS generation requests to the Narakeet API.
 */
export interface NarakeetTTSRequest {
  /** The text to be converted to speech */
  text: string;
  /** The ID of the voice profile to be used */
  voiceId: string;
  /** The output format for the audio file (fixed to 'wav' as per technical specification) */
  outputFormat: 'wav';
  /** Optional sample rate for the output audio */
  sampleRate?: 16000 | 22050 | 44100;
}

/**
 * Extends the common ApiResponse interface for Narakeet-specific TTS response data.
 */
export interface NarakeetTTSResponse extends ApiResponse<{
  /** The generated audio data as a Uint8Array */
  audioData: Uint8Array;
  /** The duration of the generated audio in seconds */
  duration: number;
  /** Metadata about the generated audio */
  metadata: {
    /** The ID of the voice profile used */
    voiceId: string;
    /** The sample rate of the generated audio */
    sampleRate: number;
    /** The format of the generated audio (always 'wav') */
    format: 'wav';
  };
}> {}

/**
 * Defines possible error codes specific to Narakeet API interactions.
 */
export type NarakeetErrorCode = 
  | 'INVALID_VOICE_ID'
  | 'TEXT_TOO_LONG'
  | 'UNSUPPORTED_LANGUAGE'
  | 'RATE_LIMIT_EXCEEDED';

/**
 * Defines the structure for Narakeet API errors.
 */
export interface NarakeetApiError {
  /** The error code */
  code: NarakeetErrorCode;
  /** A human-readable error message */
  message: string;
}

/**
 * Type guard to check if an object is a NarakeetApiError.
 * 
 * @param error - The object to check
 * @returns True if the object is a NarakeetApiError, false otherwise
 */
export function isNarakeetApiError(error: any): error is NarakeetApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  );
}

/**
 * Defines the configuration options for the Narakeet client.
 */
export interface NarakeetClientConfig {
  /** The API key for authenticating with the Narakeet service */
  apiKey: string;
  /** The base URL for the Narakeet API */
  baseUrl: string;
  /** The timeout for API requests in milliseconds */
  timeout: number;
}

/**
 * Defines the parameters for retrieving available voice profiles.
 */
export interface GetVoiceProfilesParams {
  /** Optional language code to filter voice profiles */
  language?: LanguageCode;
  /** Optional gender to filter voice profiles */
  gender?: 'male' | 'female';
}

/**
 * Defines the response structure for retrieving voice profiles.
 */
export interface GetVoiceProfilesResponse extends ApiResponse<{
  /** Array of available voice profiles */
  profiles: NarakeetVoiceProfile[];
}> {}

/**
 * Defines the parameters for generating TTS audio.
 */
export interface GenerateTTSParams extends NarakeetTTSRequest {}

/**
 * Defines the response structure for generating TTS audio.
 */
export type GenerateTTSResponse = NarakeetTTSResponse;

/**
 * Type alias for a function that handles Narakeet API errors.
 */
export type NarakeetErrorHandler = (error: NarakeetApiError) => void;

/**
 * Interface for the Narakeet client, defining the main methods for interacting with the Narakeet API.
 */
export interface NarakeetClient {
  /** Retrieves available voice profiles */
  getVoiceProfiles(params?: GetVoiceProfilesParams): Promise<GetVoiceProfilesResponse>;
  /** Generates TTS audio */
  generateTTS(params: GenerateTTSParams): Promise<GenerateTTSResponse>;
  /** Sets an error handler for Narakeet API errors */
  setErrorHandler(handler: NarakeetErrorHandler): void;
}