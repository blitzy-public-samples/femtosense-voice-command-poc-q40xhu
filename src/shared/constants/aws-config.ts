import { AWSConfig } from '../interfaces/file-storage.interface';

/**
 * AWS Region for all AWS services used in the application.
 * @constant
 * Requirement: AWS Integration (Technical Specification/5.2 CLOUD SERVICES)
 */
export const AWS_REGION: string = process.env.AWS_REGION || 'us-west-2';

/**
 * S3 Bucket name for storing generated audio files.
 * @constant
 * Requirement: AWS Integration (Technical Specification/5.2 CLOUD SERVICES)
 */
export const S3_BUCKET_NAME: string = process.env.S3_BUCKET_NAME || 'femtosense-voice-commands';

/**
 * Main AWS configuration object.
 * This object provides a centralized configuration for AWS services used in the application.
 * @constant
 * Requirements:
 * - AWS Integration (Technical Specification/5.2 CLOUD SERVICES)
 * - Centralized Configuration (Technical Specification/5.1 DEPLOYMENT ENVIRONMENT)
 * - Security Compliance (Technical Specification/6.1 AUTHENTICATION AND AUTHORIZATION)
 */
export const AWS_CONFIG: AWSConfig = {
  s3: {
    bucketName: S3_BUCKET_NAME,
    region: AWS_REGION,
    folderStructure: {
      language: '{language}',
      intent: '{intent}',
      variation: '{phrase_variation}'
    }
  },
  cloudWatch: {
    logRetentionDays: 30,
    metricsNamespace: 'FemtosenseVoiceCommands'
  }
};

/**
 * Interface defining the structure of the AWS configuration object.
 * This ensures type safety when accessing AWS settings throughout the application.
 */
export interface AWSConfig {
  s3: {
    bucketName: string;
    region: string;
    folderStructure: {
      language: string;
      intent: string;
      variation: string;
    };
  };
  cloudWatch: {
    logRetentionDays: number;
    metricsNamespace: string;
  };
}

/**
 * Validates the AWS configuration to ensure all required fields are present.
 * @throws {Error} If any required configuration is missing.
 */
export function validateAWSConfig(): void {
  if (!AWS_CONFIG.s3.bucketName) {
    throw new Error('S3 bucket name is not configured');
  }
  if (!AWS_CONFIG.s3.region) {
    throw new Error('AWS region is not configured');
  }
  // Add more validation as needed
}

/**
 * Constructs an S3 path based on the provided parameters and folder structure.
 * @param language - The language of the voice command.
 * @param intent - The intent of the voice command.
 * @param phraseVariation - The specific variation of the phrase.
 * @returns The constructed S3 path.
 */
export function constructS3Path(language: string, intent: string, phraseVariation: string): string {
  const { folderStructure } = AWS_CONFIG.s3;
  return `${folderStructure.language.replace('{language}', language)}/${folderStructure.intent.replace('{intent}', intent)}/${folderStructure.variation.replace('{phrase_variation}', phraseVariation)}`;
}

// Validate AWS configuration on module import
validateAWSConfig();