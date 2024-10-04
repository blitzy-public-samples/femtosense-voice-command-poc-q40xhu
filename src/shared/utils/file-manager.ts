/**
 * @file file-manager.ts
 * @description A utility module that provides a unified interface for file management operations
 * in the Femtosense Voice Command Generation system, handling both local and AWS S3 storage.
 * 
 * Requirements addressed:
 * - Scalable Data Management (Introduction/1.1 System Objectives/3)
 * - File Organization (Introduction/1.1 System Objectives/3)
 * - Data Management (Introduction/1.1 System Objectives/3)
 */

import { IFileStorage, AudioFileMetadata } from '../interfaces/file-storage.interface';
import { AWS_CONFIG, constructS3Path } from '../constants/aws-config';
import { logger } from './logger';
import { validateAudioMetadata } from './validators';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import path from 'path';
import { IntentType } from '../types/intent.types';
import { LanguageCode } from '../types/language.types';

class FileManager implements IFileStorage {
  private s3Client: S3Client;
  private localStoragePath: string;

  constructor(localPath?: string) {
    this.s3Client = new S3Client({
      region: AWS_CONFIG.s3.region,
    });
    this.localStoragePath = localPath || './temp';
  }

  /**
   * Saves an audio file to both local storage and S3, returning the S3 path
   * @param audioData - The audio data buffer to be saved
   * @param metadata - Metadata associated with the audio file
   * @returns Promise<string> - S3 path of the saved file
   */
  async saveAudioFile(audioData: Buffer, metadata: AudioFileMetadata): Promise<string> {
    if (!validateAudioMetadata(metadata)) {
      throw new Error('Invalid audio metadata');
    }

    const s3Key = this.generateS3Key(metadata);
    const localFilePath = path.join(this.localStoragePath, s3Key);

    try {
      // Ensure local directory exists
      await this.ensureLocalDirectory(path.dirname(localFilePath));

      // Save file locally
      await fs.writeFile(localFilePath, audioData);
      logger.info(`File saved locally: ${localFilePath}`);

      // Upload file to S3
      await this.s3Client.send(new PutObjectCommand({
        Bucket: AWS_CONFIG.s3.bucketName,
        Key: s3Key,
        Body: audioData,
        Metadata: {
          intent: metadata.intent,
          language: metadata.language,
          voiceProfile: metadata.voiceProfile,
          phrase: metadata.phrase,
          variation: metadata.variation,
        },
      }));
      logger.info(`File uploaded to S3: ${s3Key}`);

      return s3Key;
    } catch (error) {
      logger.error('Error saving audio file', { error, metadata });
      throw error;
    }
  }

  /**
   * Retrieves an audio file from S3 or local storage
   * @param filePath - The path of the audio file to retrieve
   * @returns Promise<Buffer> - Audio file data
   */
  async getAudioFile(filePath: string): Promise<Buffer> {
    try {
      // Try to get file from S3
      const s3Response = await this.s3Client.send(new GetObjectCommand({
        Bucket: AWS_CONFIG.s3.bucketName,
        Key: filePath,
      }));
      const s3Data = await s3Response.Body?.transformToByteArray();
      if (s3Data) {
        logger.info(`File retrieved from S3: ${filePath}`);
        return Buffer.from(s3Data);
      }
    } catch (s3Error) {
      logger.warn(`Failed to retrieve file from S3: ${filePath}`, { error: s3Error });
    }

    // If S3 fails, try to get file from local storage
    const localFilePath = path.join(this.localStoragePath, filePath);
    try {
      const localData = await fs.readFile(localFilePath);
      logger.info(`File retrieved from local storage: ${localFilePath}`);
      return localData;
    } catch (localError) {
      logger.error(`Failed to retrieve file from local storage: ${localFilePath}`, { error: localError });
      throw new Error(`File not found: ${filePath}`);
    }
  }

  /**
   * Deletes an audio file from both S3 and local storage
   * @param filePath - The path of the audio file to delete
   * @returns Promise<void> - Confirmation of deletion
   */
  async deleteAudioFile(filePath: string): Promise<void> {
    try {
      // Delete from S3
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: AWS_CONFIG.s3.bucketName,
        Key: filePath,
      }));
      logger.info(`File deleted from S3: ${filePath}`);

      // Delete from local storage if it exists
      const localFilePath = path.join(this.localStoragePath, filePath);
      await fs.unlink(localFilePath);
      logger.info(`File deleted from local storage: ${localFilePath}`);
    } catch (error) {
      logger.error(`Error deleting audio file: ${filePath}`, { error });
      throw error;
    }
  }

  /**
   * Lists all audio files for a given intent and language
   * @param intent - The intent type to filter audio files
   * @param language - The language code to filter audio files
   * @returns Promise<string[]> - List of file paths
   */
  async listAudioFiles(intent: IntentType, language: LanguageCode): Promise<string[]> {
    const prefix = constructS3Path(language, intent, '');
    const filePaths: string[] = [];

    try {
      const command = new ListObjectsV2Command({
        Bucket: AWS_CONFIG.s3.bucketName,
        Prefix: prefix,
      });

      let isTruncated = true;
      while (isTruncated) {
        const response = await this.s3Client.send(command);
        response.Contents?.forEach((item) => {
          if (item.Key) {
            filePaths.push(item.Key);
          }
        });
        isTruncated = response.IsTruncated || false;
        command.input.ContinuationToken = response.NextContinuationToken;
      }

      logger.info(`Listed ${filePaths.length} files for intent: ${intent}, language: ${language}`);
      return filePaths;
    } catch (error) {
      logger.error(`Error listing audio files for intent: ${intent}, language: ${language}`, { error });
      throw error;
    }
  }

  /**
   * Generates an S3 key based on the provided metadata
   * @param metadata - Metadata associated with the audio file
   * @returns string - Generated S3 key
   */
  private generateS3Key(metadata: AudioFileMetadata): string {
    return constructS3Path(
      metadata.language,
      metadata.intent,
      `${metadata.variation}/${metadata.voiceProfile}.wav`
    );
  }

  /**
   * Ensures that the local directory exists, creating it if necessary
   * @param dirPath - The directory path to ensure
   * @returns Promise<void> - Confirmation of directory existence
   */
  private async ensureLocalDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error(`Error creating directory: ${dirPath}`, { error });
      throw error;
    }
  }
}

export const fileManager = new FileManager();