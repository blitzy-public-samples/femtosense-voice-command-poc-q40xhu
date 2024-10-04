import re
from pathlib import Path
from typing import Union
from ..config.storage_config import StorageConfig
from ..models.audio_file import AudioFile
from ..models.voice_command import VoiceCommand

# Requirement: File Organization (Introduction/1.1 System Objectives/3)
# Define a regex pattern for valid path characters
VALID_PATH_CHARS = re.compile(r'[^a-zA-Z0-9_-]')

class PathGenerator:
    """
    A utility class that generates standardized file paths for audio files and ensures
    consistent organization across local and S3 storage in the Femtosense Voice Command
    Generation system.

    This class addresses the following requirements:
    - Scalable Data Management (Introduction/1.1 System Objectives/3)
    - File Organization (Introduction/1.1 System Objectives/3)
    - File Structure Definition (Technical Specification/7.5 FILE STRUCTURE EXAMPLES)
    """

    def __init__(self, storage_config: StorageConfig):
        self.storage_config = storage_config

    def generate_local_path(self, voice_command: VoiceCommand, variation_id: str, voice_id: str) -> Path:
        """
        Generates a standardized local file system path for an audio file based on the
        voice command, variation, and voice profile.

        Args:
            voice_command (VoiceCommand): The voice command object.
            variation_id (str): The ID of the specific variation.
            voice_id (str): The ID of the voice profile.

        Returns:
            Path: The generated local file system path.
        """
        language = self.sanitize_path_component(voice_command.language)
        intent = self.sanitize_path_component(voice_command.intent)
        variation = self.sanitize_path_component(variation_id)
        voice = self.sanitize_path_component(voice_id)

        return self.storage_config.get_local_path(language, intent, variation) / f"{voice}.wav"

    def generate_s3_path(self, voice_command: VoiceCommand, variation_id: str, voice_id: str) -> str:
        """
        Generates a standardized S3 path for an audio file based on the voice command,
        variation, and voice profile.

        Args:
            voice_command (VoiceCommand): The voice command object.
            variation_id (str): The ID of the specific variation.
            voice_id (str): The ID of the voice profile.

        Returns:
            str: The generated S3 path.
        """
        language = self.sanitize_path_component(voice_command.language)
        intent = self.sanitize_path_component(voice_command.intent)
        variation = self.sanitize_path_component(variation_id)
        voice = self.sanitize_path_component(voice_id)

        return f"{self.storage_config.get_s3_path(language, intent, variation)}/{voice}.wav"

    @staticmethod
    def sanitize_path_component(component: str) -> str:
        """
        Sanitizes a path component to ensure it contains only valid characters and
        follows naming conventions.

        Args:
            component (str): The path component to sanitize.

        Returns:
            str: The sanitized path component.
        """
        # Replace invalid characters with hyphens
        sanitized = VALID_PATH_CHARS.sub('-', component)
        # Convert to lowercase
        sanitized = sanitized.lower()
        # Trim leading/trailing hyphens
        return sanitized.strip('-')

    def get_temp_path(self, filename: str) -> Path:
        """
        Generates a path in the temporary directory for intermediate file processing.

        Args:
            filename (str): The name of the temporary file.

        Returns:
            Path: The generated temporary file path.
        """
        sanitized_filename = self.sanitize_path_component(filename)
        return self.storage_config.get_temp_path(create=True) / sanitized_filename

    def generate_path(self, audio_file: AudioFile, storage_type: str) -> Union[Path, str]:
        """
        Generates the appropriate path for an audio file based on the storage type.

        Args:
            audio_file (AudioFile): The audio file object.
            storage_type (str): The type of storage ('local' or 's3').

        Returns:
            Union[Path, str]: The generated path, either as a Path object for local storage
                              or a string for S3 storage.

        Raises:
            ValueError: If an invalid storage type is provided.
        """
        metadata = audio_file.metadata
        voice_command = VoiceCommand(
            phrase=metadata.original_phrase,
            intent=metadata.intent,
            language=metadata.language
        )

        if storage_type == 'local':
            return self.generate_local_path(voice_command, metadata.variation, metadata.voice_profile)
        elif storage_type == 's3':
            return self.generate_s3_path(voice_command, metadata.variation, metadata.voice_profile)
        else:
            raise ValueError(f"Invalid storage type: {storage_type}. Must be 'local' or 's3'.")

# Create a global instance of PathGenerator
path_generator = PathGenerator(StorageConfig())