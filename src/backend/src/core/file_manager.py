import os
from pathlib import Path
from typing import Dict, Any, Tuple, List
import boto3
from ..utils.logger import logger
from ..config.app_config import AppConfig
from ..utils.audio_converter import convert_to_wav

# Global configuration for the FileManager
FILE_MANAGER_CONFIG: Dict[str, Any] = {}

class FileManager:
    """
    A class that handles all file management operations for the voice command generation system.
    This class is responsible for managing both local filesystem operations and AWS S3 interactions.
    """

    def __init__(self, config: AppConfig):
        """
        Initializes the FileManager with configuration settings.

        Args:
            config (AppConfig): The application configuration instance.
        """
        self.config = config
        self.local_base_path: Path = Path(config.get('LOCAL_STORAGE_PATH', '/tmp/femtosense_poc'))
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=config.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=config.get('AWS_SECRET_ACCESS_KEY'),
            region_name=config.get('AWS_REGION', 'us-west-2')
        )
        self.bucket_name = config.get('S3_BUCKET_NAME', 'femtosense-voice-commands')

        # Ensure the local base path exists
        self.local_base_path.mkdir(parents=True, exist_ok=True)

        logger.info(f"FileManager initialized with local base path: {self.local_base_path}")

    def save_audio_file(self, audio_data: bytes, metadata: Dict[str, str]) -> Tuple[str, str]:
        """
        Saves an audio file both locally and to S3, returning the local and S3 paths.

        Args:
            audio_data (bytes): The audio file data.
            metadata (Dict[str, str]): Metadata for the audio file, including language, intent, and variation.

        Returns:
            Tuple[str, str]: Local and S3 paths of the saved file.
        """
        # Generate file paths
        relative_path = self._generate_file_path(metadata)
        local_path = self.local_base_path / relative_path
        s3_path = f"{metadata['language']}/{metadata['intent']}/{relative_path.name}"

        # Ensure the local directory exists
        local_path.parent.mkdir(parents=True, exist_ok=True)

        # Save file locally
        with open(local_path, 'wb') as f:
            f.write(audio_data)
        logger.info(f"Audio file saved locally: {local_path}")

        # Convert to WAV if necessary
        if local_path.suffix.lower() != '.wav':
            wav_path = local_path.with_suffix('.wav')
            convert_to_wav(str(local_path), str(wav_path))
            local_path = wav_path
            s3_path = s3_path.rsplit('.', 1)[0] + '.wav'

        # Upload file to S3
        self.s3_client.upload_file(
            str(local_path),
            self.bucket_name,
            s3_path,
            ExtraArgs={'Metadata': metadata}
        )
        logger.info(f"Audio file uploaded to S3: {s3_path}")

        return str(local_path), s3_path

    def get_audio_file(self, file_path: str, prefer_local: bool = True) -> bytes:
        """
        Retrieves an audio file from either local storage or S3.

        Args:
            file_path (str): The path of the file to retrieve.
            prefer_local (bool): Whether to prefer local storage over S3 if available.

        Returns:
            bytes: Audio file data.
        """
        local_path = self.local_base_path / file_path

        if prefer_local and local_path.exists():
            with open(local_path, 'rb') as f:
                audio_data = f.read()
            logger.info(f"Audio file retrieved from local storage: {local_path}")
        else:
            s3_path = file_path.replace(str(self.local_base_path), '').lstrip('/')
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=s3_path)
            audio_data = response['Body'].read()
            logger.info(f"Audio file retrieved from S3: {s3_path}")

        return audio_data

    def delete_audio_file(self, file_path: str) -> bool:
        """
        Deletes an audio file from both local storage and S3.

        Args:
            file_path (str): The path of the file to delete.

        Returns:
            bool: Success status of deletion.
        """
        local_path = self.local_base_path / file_path
        s3_path = file_path.replace(str(self.local_base_path), '').lstrip('/')

        # Delete from local storage
        if local_path.exists():
            local_path.unlink()
            logger.info(f"Audio file deleted from local storage: {local_path}")

        # Delete from S3
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_path)
            logger.info(f"Audio file deleted from S3: {s3_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete audio file from S3: {s3_path}. Error: {str(e)}")
            return False

    def list_audio_files(self, intent: str, language: str) -> List[str]:
        """
        Lists all audio files for a given intent and language.

        Args:
            intent (str): The intent to list files for.
            language (str): The language to list files for.

        Returns:
            List[str]: List of file paths.
        """
        prefix = f"{language}/{intent}/"
        response = self.s3_client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)

        file_list = []
        if 'Contents' in response:
            for obj in response['Contents']:
                file_list.append(obj['Key'])

        logger.info(f"Listed {len(file_list)} audio files for intent '{intent}' in language '{language}'")
        return file_list

    def _generate_file_path(self, metadata: Dict[str, str]) -> Path:
        """
        Generates a file path based on metadata.

        Args:
            metadata (Dict[str, str]): Metadata for the audio file.

        Returns:
            Path: Generated file path.
        """
        return Path(
            metadata['language'],
            metadata['intent'],
            f"{metadata['variation']}_{metadata.get('voice_id', 'default')}.wav"
        )

# Initialize the global FILE_MANAGER_CONFIG
FILE_MANAGER_CONFIG = {
    'LOCAL_STORAGE_PATH': os.environ.get('LOCAL_STORAGE_PATH', '/tmp/femtosense_poc'),
    'S3_BUCKET_NAME': os.environ.get('S3_BUCKET_NAME', 'femtosense-voice-commands'),
    'AWS_REGION': os.environ.get('AWS_REGION', 'us-west-2')
}