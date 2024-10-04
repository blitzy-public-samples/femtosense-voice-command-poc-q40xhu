/**
 * api-endpoints.ts
 * 
 * This file defines the constant values for all API endpoints used throughout the Femtosense Voice Command Generation system,
 * providing a centralized location for managing API URLs and paths.
 * 
 * Requirements addressed:
 * - API Integration (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
 * - Centralized Configuration (Technical Specification/3.3 COMPONENT DIAGRAMS)
 */

// Base URLs for external APIs
export const GPT_API_BASE_URL = 'https://api.openai.com';
export const NARAKEET_API_BASE_URL = 'https://api.narakeet.com';

// Interface defining the structure of API endpoints
export interface APIEndpoints {
  gpt: {
    variations: string;
  };
  narakeet: {
    tts: string;
    voices: string;
  };
}

/**
 * API_ENDPOINTS
 * 
 * This constant provides a structured object containing all API endpoints used in the application,
 * organized by service.
 */
export const API_ENDPOINTS: APIEndpoints = {
  gpt: {
    variations: `${GPT_API_BASE_URL}/v1/completions`,
  },
  narakeet: {
    tts: `${NARAKEET_API_BASE_URL}/text-to-speech/m4a`,
    voices: `${NARAKEET_API_BASE_URL}/voices`,
  },
};

/**
 * Usage example:
 * 
 * import { API_ENDPOINTS } from '@shared/constants/api-endpoints';
 * 
 * // Using GPT API endpoint
 * const gptEndpoint = API_ENDPOINTS.gpt.variations;
 * 
 * // Using Narakeet TTS endpoint
 * const ttsEndpoint = API_ENDPOINTS.narakeet.tts;
 */