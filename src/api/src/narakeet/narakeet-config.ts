/**
 * narakeet-config.ts
 * 
 * This file defines the configuration settings and types specific to the Narakeet Text-to-Speech API integration
 * within the Femtosense Voice Command Generation system.
 * 
 * Requirements addressed:
 * - TTS Integration (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Voice Profiles (Technical Specification/7.1.1 Voice Registry Details)
 * - Audio Generation (Technical Specification/1.1 SYSTEM OBJECTIVES)
 */

import { API_ENDPOINTS } from '@shared/constants/api-endpoints';
import { LanguageCode } from '@shared/types/language.types';

/**
 * Interface defining the structure for Narakeet configuration settings
 */
export interface NarakeetConfig {
  apiVersion: string;
  outputFormat: AudioFormat;
  voiceRegistry: VoiceRegistry;
  requestTimeout: number;
  maxRetries: number;
}

/**
 * Interface specifying the audio output format settings
 */
export interface AudioFormat {
  format: 'wav';
  sampleRate: 16000;
  bitDepth: 16;
}

/**
 * Interface mapping language codes to arrays of available voice profiles
 */
export interface VoiceRegistry {
  [key in LanguageCode]: string[];
}

/**
 * Constant defining the Narakeet configuration settings
 */
export const NARAKEET_CONFIG: NarakeetConfig = {
  apiVersion: 'v1',
  outputFormat: {
    format: 'wav',
    sampleRate: 16000,
    bitDepth: 16
  },
  voiceRegistry: {
    korean: ['Chae-Won', 'Min-Ho', 'Seo-Yeon', 'Tae-Hee', 'Joon-Gi', 'In-Guk', 'Hye-Rim', 'Ji-Sung', 'Jae-Hyun', 'Yoo-Jung', 'Ji-Yeon', 'Bo-Young', 'Da-Hee', 'Hye-Kyo'],
    english: ['Matt', 'Linda', 'Betty', 'Beatrice', 'Nelson', 'Alfred'],
    japanese: ['Yuriko', 'Akira', 'Kasumi', 'Kenichi', 'Tomoka', 'Takuya', 'Takeshi', 'Mariko', 'Kei', 'Ayami', 'Hideaki', 'Kaori', 'Kenji', 'Kuniko']
  },
  requestTimeout: 30000, // 30 seconds
  maxRetries: 3
};

/**
 * Function to retrieve available voices for a specified language
 * 
 * @param language - The LanguageCode for which to retrieve available voices
 * @returns An array of voice names available for the specified language
 */
export function getVoiceForLanguage(language: LanguageCode): string[] {
  return NARAKEET_CONFIG.voiceRegistry[language] || [];
}

/**
 * Constant for the Narakeet TTS API endpoint
 */
export const NARAKEET_TTS_ENDPOINT = API_ENDPOINTS.narakeet.tts;

/**
 * Constant for the Narakeet Voices API endpoint
 */
export const NARAKEET_VOICES_ENDPOINT = API_ENDPOINTS.narakeet.voices;

/**
 * Function to generate the full Narakeet TTS API URL with query parameters
 * 
 * @param voice - The name of the voice to use
 * @returns The full URL for the Narakeet TTS API request
 */
export function getNarakeetTtsUrl(voice: string): string {
  const { format, sampleRate, bitDepth } = NARAKEET_CONFIG.outputFormat;
  return `${NARAKEET_TTS_ENDPOINT}?voice=${encodeURIComponent(voice)}&format=${format}&sampleRate=${sampleRate}&bitDepth=${bitDepth}`;
}

/**
 * Type for Narakeet API response error
 */
export interface NarakeetApiError {
  error: string;
  message: string;
}

/**
 * Type guard to check if an object is a NarakeetApiError
 * 
 * @param obj - The object to check
 * @returns True if the object is a NarakeetApiError, false otherwise
 */
export function isNarakeetApiError(obj: any): obj is NarakeetApiError {
  return typeof obj === 'object' && obj !== null && 'error' in obj && 'message' in obj;
}