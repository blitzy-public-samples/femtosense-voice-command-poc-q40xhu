/**
 * @file file-storage.interface.ts
 * @description This file defines the contract for file storage operations in the Femtosense Voice Command Generation system,
 * providing a consistent abstraction for both local and cloud storage implementations.
 */

// Assuming these types are defined in their respective files
import { LanguageCode } from '../types/language.types';
import { IntentType } from '../types/intent.types';

/**
 * Interface defining the metadata structure for audio files
 * @interface AudioFileMetadata
 */
export interface AudioFileMetadata {
  intent: IntentType;
  language: LanguageCode;
  voiceProfile: string;
  phrase: string;
  variation: string;
}

/**
 * Primary interface defining the contract for file storage operations in the system
 * @interface IFileStorage
 */
export interface IFileStorage {
  /**
   * Saves an audio file to the storage system
   * @param audioData - The audio data buffer to be saved
   * @param metadata - Metadata associated with the audio file
   * @returns A promise that resolves to the path of the saved audio file
   */
  saveAudioFile(audioData: Buffer, metadata: AudioFileMetadata): Promise<string>;

  /**
   * Retrieves an audio file from the storage system
   * @param filePath - The path of the audio file to retrieve
   * @returns A promise that resolves to the audio file data as a Buffer
   */
  getAudioFile(filePath: string): Promise<Buffer>;

  /**
   * Deletes an audio file from the storage system
   * @param filePath - The path of the audio file to delete
   * @returns A promise that resolves when the file is successfully deleted
   */
  deleteAudioFile(filePath: string): Promise<void>;

  /**
   * Lists audio files in the storage system based on intent and language
   * @param intent - The intent type to filter audio files
   * @param language - The language code to filter audio files
   * @returns A promise that resolves to an array of file paths matching the criteria
   */
  listAudioFiles(intent: IntentType, language: LanguageCode): Promise<string[]>;
}