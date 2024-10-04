import logging
from typing import List, Tuple, Optional
from ..models.audio_file import AudioFile
from ..models.voice_command import VoiceCommand
from ..file_storage.s3_storage import S3Storage
from ..utils.file_validator import validate_audio_file
from ..config.storage_config import StorageConfig

logger = logging.getLogger(__name__)

class AudioFileDAO:
    """
    A Data Access Object (DAO) implementation for managing audio files in the Femtosense Voice Command Generation system,
    providing a unified interface for S3 storage operations.

    This class addresses the following requirements:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Implement robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Organize generated data in a structured, easily accessible format
    - High-Quality Audio Dataset Creation (Introduction/1.1 System Objectives/2): Ensure consistent audio quality across all generated files
    """

    def __init__(self, s3_storage: S3Storage):
        """
        Initializes the AudioFileDAO with S3 storage.

        Args:
            s3_storage (S3Storage): An instance of S3Storage for managing S3 operations.
        """
        self.s3_storage = s3_storage

    def save_audio_file(self, audio_file: AudioFile, voice_command: VoiceCommand, variation_id: str, voice_id: str) -> str:
        """
        Saves an audio file to S3 storage.

        Args:
            audio_file (AudioFile): The audio file to be saved.
            voice_command (VoiceCommand): The associated voice command.
            variation_id (str): The ID of the variation.
            voice_id (str): The ID of the voice profile.

        Returns:
            str: S3 URI of the saved file.

        Raises:
            ValueError: If the audio file is invalid.
        """
        try:
            # Validate the audio file
            if not validate_audio_file(audio_file):
                raise ValueError("Invalid audio file")

            # Update metadata
            audio_file.metadata.intent = voice_command.intent
            audio_file.metadata.variation = variation_id
            audio_file.metadata.voice_profile = voice_id

            # Save file to S3 storage
            s3_uri = self.s3_storage.upload_file(audio_file)

            logger.info(f"Audio file saved successfully: {s3_uri}")
            return s3_uri

        except Exception as e:
            logger.error(f"Error saving audio file: {str(e)}")
            raise

    def get_audio_file(self, voice_command: VoiceCommand, variation_id: str, voice_id: str) -> Optional[AudioFile]:
        """
        Retrieves an audio file from S3 storage.

        Args:
            voice_command (VoiceCommand): The associated voice command.
            variation_id (str): The ID of the variation.
            voice_id (str): The ID of the voice profile.

        Returns:
            Optional[AudioFile]: Retrieved audio file or None if not found.
        """
        try:
            # Construct the S3 URI
            config = StorageConfig()
            s3_path = config.get_s3_path(voice_command.language, voice_command.intent, variation_id)
            file_name = f"{voice_id}.wav"
            s3_uri = f"s3://{config.s3_bucket}/{s3_path}/{file_name}"

            # Retrieve file from S3 storage
            audio_file = self.s3_storage.download_file(s3_uri)

            if audio_file:
                logger.info(f"Audio file retrieved successfully: {s3_uri}")
            else:
                logger.warning(f"Audio file not found: {s3_uri}")

            return audio_file

        except Exception as e:
            logger.error(f"Error retrieving audio file: {str(e)}")
            return None

    def delete_audio_file(self, voice_command: VoiceCommand, variation_id: str, voice_id: str) -> bool:
        """
        Deletes an audio file from S3 storage.

        Args:
            voice_command (VoiceCommand): The associated voice command.
            variation_id (str): The ID of the variation.
            voice_id (str): The ID of the voice profile.

        Returns:
            bool: True if deletion was successful, False otherwise.
        """
        try:
            # Construct the S3 URI
            config = StorageConfig()
            s3_path = config.get_s3_path(voice_command.language, voice_command.intent, variation_id)
            file_name = f"{voice_id}.wav"
            s3_uri = f"s3://{config.s3_bucket}/{s3_path}/{file_name}"

            # Delete file from S3 storage
            success = self.s3_storage.delete_file(s3_uri)

            if success:
                logger.info(f"Audio file deleted successfully: {s3_uri}")
            else:
                logger.warning(f"Failed to delete audio file: {s3_uri}")

            return success

        except Exception as e:
            logger.error(f"Error deleting audio file: {str(e)}")
            return False

    def list_audio_files(self, voice_command: Optional[VoiceCommand] = None) -> List[str]:
        """
        Lists all audio files or those matching a specific voice command.

        Args:
            voice_command (Optional[VoiceCommand]): The voice command to filter by, or None for all files.

        Returns:
            List[str]: List of S3 URIs of the audio files.
        """
        try:
            prefix = ''
            if voice_command:
                config = StorageConfig()
                prefix = config.get_s3_path(voice_command.language, voice_command.intent)

            # List files from S3 storage
            s3_uris = self.s3_storage.list_files(prefix)

            logger.info(f"Listed {len(s3_uris)} audio files")
            return s3_uris

        except Exception as e:
            logger.error(f"Error listing audio files: {str(e)}")
            return []

# Example usage:
# config = StorageConfig()
# s3_storage = S3Storage(config)
# audio_file_dao = AudioFileDAO(s3_storage)
#
# # Save an audio file
# audio_file = AudioFile(...)  # Create an AudioFile instance
# voice_command = VoiceCommand(...)  # Create a VoiceCommand instance
# s3_uri = audio_file_dao.save_audio_file(audio_file, voice_command, "variation_1", "voice_1")
#
# # Retrieve an audio file
# retrieved_audio_file = audio_file_dao.get_audio_file(voice_command, "variation_1", "voice_1")
#
# # Delete an audio file
# success = audio_file_dao.delete_audio_file(voice_command, "variation_1", "voice_1")
#
# # List audio files
# all_files = audio_file_dao.list_audio_files()
# specific_files = audio_file_dao.list_audio_files(voice_command)