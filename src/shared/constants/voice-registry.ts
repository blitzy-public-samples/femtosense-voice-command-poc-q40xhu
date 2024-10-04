import { VoiceProfile } from '../interfaces/voice-command.interface';

/**
 * Enum representing the supported language codes.
 * This enum is used to ensure type safety when working with language-specific data.
 */
export enum LanguageCode {
  KOREAN = 'korean',
  ENGLISH = 'english',
  JAPANESE = 'japanese',
}

/**
 * Type definition for the structure of the voice registry.
 * It organizes voices by language and region.
 */
export type VoiceRegistryType = Record<LanguageCode, Record<string, string[]>>;

/**
 * Constant defining the voice registry for the Femtosense Voice Command Generation PoC.
 * This registry provides a centralized source of voice profile information.
 * 
 * @remarks
 * This constant addresses the following requirements:
 * - Multi-language Support (1.1 SYSTEM OBJECTIVES/1): Define available voices for Korean, English, and Japanese
 * - Voice Profiles (1.1 SYSTEM OBJECTIVES/2): Provide diverse voice profiles for comprehensive training data
 * - Structured Data Organization (3.2 HIGH-LEVEL ARCHITECTURE DIAGRAM): Organize voice profiles by language and region
 */
export const VOICE_REGISTRY: VoiceRegistryType = {
  [LanguageCode.KOREAN]: {
    default: [
      'Chae-Won', 'Min-Ho', 'Seo-Yeon', 'Tae-Hee', 'Joon-Gi',
      'In-Guk', 'Hye-Rim', 'Ji-Sung', 'Jae-Hyun', 'Yoo-Jung',
      'Ji-Yeon', 'Bo-Young', 'Da-Hee', 'Hye-Kyo'
    ],
  },
  [LanguageCode.ENGLISH]: {
    uk: ['Beatrice', 'Nelson', 'Alfred'],
    us: ['Matt', 'Linda', 'Betty'],
    canada: ['Ryan', 'Pamela'],
  },
  [LanguageCode.JAPANESE]: {
    default: [
      'Yuriko', 'Akira', 'Kasumi', 'Kenichi', 'Tomoka',
      'Takuya', 'Takeshi', 'Mariko', 'Kei', 'Ayami',
      'Hideaki', 'Kaori', 'Kenji', 'Kuniko'
    ],
  },
};

/**
 * Constant defining the default voices for each supported language.
 * This provides a quick reference for selecting a default voice when language-specific customization is not required.
 */
export const DEFAULT_VOICES: Record<LanguageCode, string> = {
  [LanguageCode.KOREAN]: 'Chae-Won',
  [LanguageCode.ENGLISH]: 'Matt',
  [LanguageCode.JAPANESE]: 'Yuriko',
};

/**
 * Function to get all available voices for a given language.
 * 
 * @param language - The language code for which to retrieve voices.
 * @returns An array of all voice names available for the specified language.
 */
export function getVoicesForLanguage(language: LanguageCode): string[] {
  return Object.values(VOICE_REGISTRY[language]).flat();
}

/**
 * Function to get the default voice for a given language.
 * 
 * @param language - The language code for which to retrieve the default voice.
 * @returns The name of the default voice for the specified language.
 */
export function getDefaultVoice(language: LanguageCode): string {
  return DEFAULT_VOICES[language];
}

/**
 * Function to check if a given voice is available for a specific language.
 * 
 * @param language - The language code to check against.
 * @param voice - The name of the voice to check.
 * @returns A boolean indicating whether the voice is available for the specified language.
 */
export function isVoiceAvailable(language: LanguageCode, voice: string): boolean {
  return getVoicesForLanguage(language).includes(voice);
}