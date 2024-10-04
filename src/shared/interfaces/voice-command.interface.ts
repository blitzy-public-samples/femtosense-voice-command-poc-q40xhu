/**
 * This file defines the core structure for voice commands in the Femtosense Voice Command Generation system,
 * ensuring consistent data representation across all components.
 */

// Assuming Intent and Language are imported from their respective files
import { Intent } from '../types/intent.types';
import { Language } from '../types/language.types';

/**
 * Interface defining the structure of a voice command in the system
 * @interface VoiceCommand
 */
export interface VoiceCommand {
  /** Unique identifier for the voice command */
  id: string;

  /** The phrase representing the voice command */
  phrase: string;

  /** The intent associated with the voice command */
  intent: Intent;

  /** The language of the voice command */
  language: Language;

  /** Array of variations of the original voice command */
  variations: VoiceCommandVariation[];

  /** Metadata associated with the voice command */
  metadata: VoiceCommandMetadata;
}

/**
 * Interface for variations of the original voice command
 * @interface VoiceCommandVariation
 */
export interface VoiceCommandVariation {
  /** Unique identifier for the variation */
  id: string;

  /** The phrase representing the variation */
  phrase: string;

  /** Array of audio files generated for this variation */
  audioFiles: VoiceCommandAudioFile[];
}

/**
 * Interface for audio files generated from voice commands
 * @interface VoiceCommandAudioFile
 */
export interface VoiceCommandAudioFile {
  /** Unique identifier for the audio file */
  id: string;

  /** The voice profile used to generate the audio */
  voiceProfile: string;

  /** URL of the audio file */
  fileUrl: string;

  /** Format of the audio file (always WAV) */
  format: 'WAV';

  /** Metadata associated with the audio file */
  metadata: AudioFileMetadata;
}

/**
 * Interface for metadata associated with voice commands
 * @interface VoiceCommandMetadata
 */
export interface VoiceCommandMetadata {
  /** Timestamp of when the voice command was created */
  createdAt: string;

  /** Timestamp of when the voice command was last updated */
  updatedAt: string;

  /** Flag indicating if the voice command is a distractor */
  isDistractor: boolean;
}

/**
 * Interface for metadata specific to audio files
 * @interface AudioFileMetadata
 */
export interface AudioFileMetadata {
  /** Duration of the audio file in seconds */
  duration: number;

  /** Sample rate of the audio file */
  sampleRate: number;

  /** Timestamp of when the audio file was created */
  createdAt: string;
}