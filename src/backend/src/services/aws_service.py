import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Optional

from ..utils.logger import logger, log_decorator
from ..config.app_config import APP_CONFIG
from ..utils.error_handler import FileSystemError

class AWSService:
    """
    A service class that handles all AWS S3 interactions for the application.

    Requirements addressed:
    - Scalable Data Management (Technical Specification/1.1 SYSTEM OBJECTIVES/3)
    - Structured Storage (Technical Specification/1.1 SYSTEM OBJECTIVES/3)
    - AWS Integration (Technical Specification/3.6 COMPONENT DETAILS/4)
    """

    def __init__(self, config=APP_CONFIG):
        """
        Initializes the AWS service with configuration settings.

        Args:
            config (AppConfig): Application configuration instance.
        """
        self.config = config
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=config.aws_config['credentials']['access_key_id'],
            aws_secret_access_key=config.aws_config['credentials']['secret_access_key'],
            region_name=config.aws_config['s3']['region']
        )
        self.bucket_name = config.aws_config['s3']['bucket_name']

    @log_decorator(level="INFO")
    def upload_audio_file(self, file_path: str, audio_data: bytes, metadata: Dict[str, str]) -> str:
        """
        Uploads an audio file to AWS S3 and returns the S3 URL.

        Args:
            file_path (str): The S3 path where the file will be stored.
            audio_data (bytes): The audio file data.
            metadata (Dict[str, str]): Metadata to be attached to the S3 object.

        Returns:
            str: S3 URL of the uploaded file.

        Raises:
            FileSystemError: If there's an error during the upload process.
        """
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_path,
                Body=audio_data,
                Metadata=metadata,
                ContentType='audio/wav'
            )
            s3_url = f"https://{self.bucket_name}.s3.amazonaws.com/{file_path}"
            logger.info(f"Successfully uploaded file to S3: {s3_url}")
            return s3_url
        except ClientError as e:
            error_message = f"Error uploading file to S3: {str(e)}"
            logger.error(error_message)
            raise FileSystemError(error_message)

    @log_decorator(level="INFO")
    def download_audio_file(self, file_path: str) -> bytes:
        """
        Downloads an audio file from AWS S3.

        Args:
            file_path (str): The S3 path of the file to be downloaded.

        Returns:
            bytes: Audio file data.

        Raises:
            FileSystemError: If there's an error during the download process.
        """
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_path)
            audio_data = response['Body'].read()
            logger.info(f"Successfully downloaded file from S3: {file_path}")
            return audio_data
        except ClientError as e:
            error_message = f"Error downloading file from S3: {str(e)}"
            logger.error(error_message)
            raise FileSystemError(error_message)

    @log_decorator(level="INFO")
    def delete_audio_file(self, file_path: str) -> bool:
        """
        Deletes an audio file from AWS S3.

        Args:
            file_path (str): The S3 path of the file to be deleted.

        Returns:
            bool: Success status of deletion.

        Raises:
            FileSystemError: If there's an error during the deletion process.
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_path)
            logger.info(f"Successfully deleted file from S3: {file_path}")
            return True
        except ClientError as e:
            error_message = f"Error deleting file from S3: {str(e)}"
            logger.error(error_message)
            raise FileSystemError(error_message)

    @log_decorator(level="INFO")
    def list_audio_files(self, prefix: str) -> List[str]:
        """
        Lists all audio files in a specific S3 prefix.

        Args:
            prefix (str): The S3 prefix to list objects from.

        Returns:
            List[str]: List of file paths.

        Raises:
            FileSystemError: If there's an error during the listing process.
        """
        try:
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
            file_paths = [obj['Key'] for obj in response.get('Contents', [])]
            logger.info(f"Successfully listed files from S3 prefix: {prefix}")
            return file_paths
        except ClientError as e:
            error_message = f"Error listing files from S3: {str(e)}"
            logger.error(error_message)
            raise FileSystemError(error_message)

def generate_s3_path(language: str, intent: str, variation: str, voice_id: str) -> str:
    """
    Generates a standardized S3 path for audio files.

    Args:
        language (str): The language of the audio file.
        intent (str): The intent of the voice command.
        variation (str): The variation of the voice command.
        voice_id (str): The ID of the voice used for the audio.

    Returns:
        str: Standardized S3 path.

    Raises:
        ValueError: If any of the input parameters are invalid.
    """
    if not all([language, intent, variation, voice_id]):
        raise ValueError("All parameters (language, intent, variation, voice_id) must be non-empty strings.")

    folder_structure = APP_CONFIG.aws_config['s3']['folder_structure']
    s3_path = f"{folder_structure['language'].format(language=language)}/" \
              f"{folder_structure['intent'].format(intent=intent)}/" \
              f"{folder_structure['variation'].format(phrase_variation=variation)}/" \
              f"{voice_id}.wav"
    
    return s3_path

# Initialize the AWSService
aws_service = AWSService()