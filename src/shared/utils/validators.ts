/**
 * This file provides validation functions for various data types and structures
 * used throughout the Femtosense Voice Command Generation system.
 * 
 * Requirements addressed:
 * - Input Validation (Technical Specification/1.2.1 Core Functionalities)
 * - Multi-language Support (Technical Specification/1.1 SYSTEM OBJECTIVES)
 * - Data Quality Assurance (Technical Specification/2. QUALITY ASSURANCE)
 */

import { VoiceCommand, VoiceCommandVariation, VoiceCommandAudioFile, AudioFileMetadata } from '../interfaces/voice-command.interface';
import { Intent, isValidIntent } from '../types/intent.types';
import { LanguageCode, isValidLanguageCode, SUPPORTED_LANGUAGES } from '../types/language.types';

// Global constants
const MAX_PHRASE_LENGTH = 100;
const MIN_PHRASE_LENGTH = 2;
const VALID_SAMPLE_RATES = [16000, 22050, 44100];

/**
 * Validates if a given string is a supported language code
 * @param code - The language code to validate
 * @returns True if the code is a valid LanguageCode, acting as a type guard
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return SUPPORTED_LANGUAGES.includes(code as LanguageCode);
}

/**
 * Type guard function to validate if an unknown object conforms to the VoiceCommand interface
 * @param command - The object to validate
 * @returns True if the object is a valid VoiceCommand, acting as a type guard
 */
export function isValidVoiceCommand(command: unknown): command is VoiceCommand {
  if (typeof command !== 'object' || command === null) {
    return false;
  }

  const { id, phrase, intent, language, variations, metadata } = command as VoiceCommand;

  return (
    typeof id === 'string' &&
    typeof phrase === 'string' &&
    isValidIntent(intent) &&
    isValidLanguageCode(language) &&
    Array.isArray(variations) &&
    variations.every(isValidVoiceCommandVariation) &&
    isValidVoiceCommandMetadata(metadata)
  );
}

/**
 * Validates if a given string is a valid Intent enum value
 * @param intent - The intent string to validate
 * @returns True if the string is a valid Intent, acting as a type guard
 */
export function isValidIntent(intent: string): intent is Intent {
  return Object.values(Intent).includes(intent as Intent);
}

/**
 * Validates a voice command phrase based on language-specific requirements
 * @param phrase - The phrase to validate
 * @param language - The language of the phrase
 * @returns True if the phrase is valid for the given language
 */
export function validatePhrase(phrase: string, language: LanguageCode): boolean {
  if (phrase.length < MIN_PHRASE_LENGTH || phrase.length > MAX_PHRASE_LENGTH) {
    return false;
  }

  // Language-specific validation rules
  switch (language) {
    case 'korean':
      // Korean-specific validation (e.g., check for valid Hangul characters)
      return /^[가-힣\s]+$/.test(phrase);
    case 'english':
      // English-specific validation (e.g., check for valid ASCII characters)
      return /^[a-zA-Z\s]+$/.test(phrase);
    case 'japanese':
      // Japanese-specific validation (e.g., check for valid Hiragana, Katakana, and Kanji)
      return /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\s]+$/u.test(phrase);
    default:
      return false;
  }
}

/**
 * Validates the structure and values of audio file metadata
 * @param metadata - The metadata object to validate
 * @returns True if the metadata is valid
 */
export function validateAudioMetadata(metadata: unknown): metadata is AudioFileMetadata {
  if (typeof metadata !== 'object' || metadata === null) {
    return false;
  }

  const { duration, sampleRate, createdAt } = metadata as AudioFileMetadata;

  return (
    typeof duration === 'number' &&
    duration > 0 &&
    typeof sampleRate === 'number' &&
    VALID_SAMPLE_RATES.includes(sampleRate) &&
    typeof createdAt === 'string' &&
    !isNaN(Date.parse(createdAt))
  );
}

/**
 * Validates a VoiceCommandVariation object
 * @param variation - The variation object to validate
 * @returns True if the variation is valid
 */
function isValidVoiceCommandVariation(variation: unknown): variation is VoiceCommandVariation {
  if (typeof variation !== 'object' || variation === null) {
    return false;
  }

  const { id, phrase, audioFiles } = variation as VoiceCommandVariation;

  return (
    typeof id === 'string' &&
    typeof phrase === 'string' &&
    Array.isArray(audioFiles) &&
    audioFiles.every(isValidVoiceCommandAudioFile)
  );
}

/**
 * Validates a VoiceCommandAudioFile object
 * @param audioFile - The audio file object to validate
 * @returns True if the audio file is valid
 */
function isValidVoiceCommandAudioFile(audioFile: unknown): audioFile is VoiceCommandAudioFile {
  if (typeof audioFile !== 'object' || audioFile === null) {
    return false;
  }

  const { id, voiceProfile, fileUrl, format, metadata } = audioFile as VoiceCommandAudioFile;

  return (
    typeof id === 'string' &&
    typeof voiceProfile === 'string' &&
    typeof fileUrl === 'string' &&
    format === 'WAV' &&
    validateAudioMetadata(metadata)
  );
}

/**
 * Validates the metadata of a VoiceCommand
 * @param metadata - The metadata object to validate
 * @returns True if the metadata is valid
 */
function isValidVoiceCommandMetadata(metadata: unknown): metadata is VoiceCommand['metadata'] {
  if (typeof metadata !== 'object' || metadata === null) {
    return false;
  }

  const { createdAt, updatedAt, isDistractor } = metadata as VoiceCommand['metadata'];

  return (
    typeof createdAt === 'string' &&
    !isNaN(Date.parse(createdAt)) &&
    typeof updatedAt === 'string' &&
    !isNaN(Date.parse(updatedAt)) &&
    typeof isDistractor === 'boolean'
  );
}

/**
 * Validates a date string
 * @param dateString - The date string to validate
 * @returns True if the date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  return !isNaN(Date.parse(dateString));
}

/**
 * Validates a URL string
 * @param url - The URL string to validate
 * @returns True if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a number is within a specified range
 * @param value - The number to validate
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns True if the number is within the specified range
 */
export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}