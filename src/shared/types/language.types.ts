/**
 * This file defines the language-related types and constants used throughout the
 * Femtosense Voice Command Generation PoC, ensuring consistent language handling
 * across the application.
 * 
 * Requirements addressed:
 * - Multi-language Support (1.1 SYSTEM OBJECTIVES/1)
 * - Structured Data Organization (3.2 HIGH-LEVEL ARCHITECTURE DIAGRAM)
 */

/**
 * An array of supported language codes.
 * This array is used as the source for the LanguageCode type.
 */
export const SUPPORTED_LANGUAGES = ['korean', 'english', 'japanese'] as const;

/**
 * A union type representing the supported language codes.
 * This type is derived from the SUPPORTED_LANGUAGES array to ensure type safety
 * and consistency across the application.
 */
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

/**
 * Interface defining the structure for language-specific configuration.
 */
export interface LanguageConfig {
  /** The language code (e.g., 'korean', 'english', 'japanese') */
  code: LanguageCode;
  /** The display name of the language in its native script */
  displayName: string;
  /** Indicates whether the language is written right-to-left */
  isRightToLeft: boolean;
}

/**
 * A record of language configurations, keyed by LanguageCode.
 * This constant provides easy access to language-specific settings throughout the application.
 */
export const LANGUAGE_CONFIGS: Readonly<Record<LanguageCode, LanguageConfig>> = {
  korean: {
    code: 'korean',
    displayName: '한국어',
    isRightToLeft: false,
  },
  english: {
    code: 'english',
    displayName: 'English',
    isRightToLeft: false,
  },
  japanese: {
    code: 'japanese',
    displayName: '日本語',
    isRightToLeft: false,
  },
};

/**
 * A type guard function to check if a given string is a valid LanguageCode.
 * 
 * @param code - The string to check
 * @returns True if the code is a valid LanguageCode, false otherwise
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.includes(code as LanguageCode);
}

/**
 * Retrieves the LanguageConfig for a given LanguageCode.
 * 
 * @param code - The LanguageCode to look up
 * @returns The corresponding LanguageConfig
 * @throws Error if an invalid LanguageCode is provided
 */
export function getLanguageConfig(code: LanguageCode): LanguageConfig {
  const config = LANGUAGE_CONFIGS[code];
  if (!config) {
    throw new Error(`Invalid language code: ${code}`);
  }
  return config;
}

/**
 * Returns an array of all supported LanguageCodes.
 * 
 * @returns An array of LanguageCodes
 */
export function getSupportedLanguages(): LanguageCode[] {
  return [...SUPPORTED_LANGUAGES];
}