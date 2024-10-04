import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import logging
from typing import List, Optional
from ..config.storage_config import StorageConfig
from ..models.audio_file import AudioFile

# Set up logging
logger = logging.getLogger(__name__)

class S3Storage:
    """
    A class that handles all S3-related storage operations for audio files.

    This class addresses the following requirements:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Implement robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Organize generated data in a structured, easily accessible format
    - AWS S3 Integration (Technical Specification/5.2 CLOUD SERVICES): Configure S3-specific settings for cloud storage
    """

    def __init__(self, config: StorageConfig):
        """
        Initializes the S3Storage instance with configuration and creates an S3 client.

        Args:
            config (StorageConfig): Configuration object containing S3 settings.
        """
        self.config = config
        self.s3_client = boto3.client('s3', region_name=config.aws_region)

    def upload_file(self, audio_file: AudioFile) -> str:
        """
        Uploads an audio file to S3 and returns the S3 URI.

        Args:
            audio_file (AudioFile): The audio file to be uploaded.

        Returns:
            str: S3 URI of the uploaded file.

        Raises:
            ClientError: If there's an error with the S3 client.
            NoCredentialsError: If AWS credentials are not found.
        """
        try:
            s3_path = self.config.get_s3_path(
                audio_file.metadata.language,
                audio_file.metadata.intent,
                audio_file.metadata.variation
            )
            file_name = f"{audio_file.metadata.voice_profile}.{audio_file.metadata.file_format}"
            s3_key = f"{s3_path}/{file_name}"

            # Upload file with server-side encryption
            self.s3_client.put_object(
                Bucket=self.config.s3_bucket,
                Key=s3_key,
                Body=audio_file.to_binary_io(),
                ContentType=f"audio/{audio_file.metadata.file_format}",
                ServerSideEncryption='AES256'
            )

            s3_uri = f"s3://{self.config.s3_bucket}/{s3_key}"
            logger.info(f"Successfully uploaded file to {s3_uri}")
            return s3_uri

        except ClientError as e:
            logger.error(f"Error uploading file to S3: {str(e)}")
            raise
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise

    def download_file(self, s3_uri: str) -> Optional[AudioFile]:
        """
        Downloads an audio file from S3 and returns it as an AudioFile object.

        Args:
            s3_uri (str): The S3 URI of the file to download.

        Returns:
            Optional[AudioFile]: Downloaded audio file or None if not found.

        Raises:
            ClientError: If there's an error with the S3 client.
            NoCredentialsError: If AWS credentials are not found.
        """
        try:
            bucket, key = self._parse_s3_uri(s3_uri)
            response = self.s3_client.get_object(Bucket=bucket, Key=key)
            
            # Extract metadata from S3 object
            metadata = self._extract_metadata_from_s3(response)
            
            # Create AudioFile object
            audio_file = AudioFile.from_binary_io(response['Body'], metadata)
            logger.info(f"Successfully downloaded file from {s3_uri}")
            return audio_file

        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                logger.warning(f"File not found: {s3_uri}")
                return None
            logger.error(f"Error downloading file from S3: {str(e)}")
            raise
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise

    def delete_file(self, s3_uri: str) -> bool:
        """
        Deletes an audio file from S3.

        Args:
            s3_uri (str): The S3 URI of the file to delete.

        Returns:
            bool: True if deletion was successful, False otherwise.

        Raises:
            ClientError: If there's an error with the S3 client.
            NoCredentialsError: If AWS credentials are not found.
        """
        try:
            bucket, key = self._parse_s3_uri(s3_uri)
            self.s3_client.delete_object(Bucket=bucket, Key=key)
            logger.info(f"Successfully deleted file: {s3_uri}")
            return True

        except ClientError as e:
            logger.error(f"Error deleting file from S3: {str(e)}")
            return False
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise

    def list_files(self, prefix: str = '') -> List[str]:
        """
        Lists all audio files in the S3 bucket, optionally filtered by prefix.

        Args:
            prefix (str): Optional prefix to filter the files.

        Returns:
            List[str]: List of S3 URIs.

        Raises:
            ClientError: If there's an error with the S3 client.
            NoCredentialsError: If AWS credentials are not found.
        """
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(Bucket=self.config.s3_bucket, Prefix=prefix)

            file_list = []
            for page in page_iterator:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        file_list.append(f"s3://{self.config.s3_bucket}/{obj['Key']}")

            logger.info(f"Successfully listed {len(file_list)} files with prefix: {prefix}")
            return file_list

        except ClientError as e:
            logger.error(f"Error listing files from S3: {str(e)}")
            raise
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise

    def _parse_s3_uri(self, s3_uri: str) -> tuple:
        """
        Parses an S3 URI to extract bucket and key.

        Args:
            s3_uri (str): The S3 URI to parse.

        Returns:
            tuple: (bucket, key)

        Raises:
            ValueError: If the S3 URI is invalid.
        """
        if not s3_uri.startswith('s3://'):
            raise ValueError(f"Invalid S3 URI: {s3_uri}")
        
        parts = s3_uri[5:].split('/', 1)
        if len(parts) != 2:
            raise ValueError(f"Invalid S3 URI: {s3_uri}")
        
        return parts[0], parts[1]

    def _extract_metadata_from_s3(self, s3_object) -> dict:
        """
        Extracts metadata from an S3 object.

        Args:
            s3_object: The S3 object containing metadata.

        Returns:
            dict: Extracted metadata.
        """
        # Extract relevant metadata from S3 object
        # This is a simplified version and should be expanded based on your specific metadata structure
        metadata = {
            'content_type': s3_object['ContentType'],
            'content_length': s3_object['ContentLength'],
            'last_modified': s3_object['LastModified'].isoformat(),
        }
        
        # Add any custom metadata from S3 object
        metadata.update(s3_object.get('Metadata', {}))
        
        return metadata

# Example usage:
# config = StorageConfig()
# s3_storage = S3Storage(config)
# 
# # Upload a file
# audio_file = AudioFile(...)  # Create an AudioFile instance
# s3_uri = s3_storage.upload_file(audio_file)
# 
# # Download a file
# downloaded_audio_file = s3_storage.download_file(s3_uri)
# 
# # Delete a file
# success = s3_storage.delete_file(s3_uri)
# 
# # List files
# file_list = s3_storage.list_files(prefix='english/LIGHTS_ON')