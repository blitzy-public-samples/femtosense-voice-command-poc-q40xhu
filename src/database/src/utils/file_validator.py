import wave
from pathlib import Path
from typing import Tuple, List
import os

from ..models.audio_file import AudioFile
from ..models.voice_command import VoiceCommand
from ..config.storage_config import StorageConfig

# Constants for audio file validation
VALID_SAMPLE_RATES: Tuple[int, ...] = (16000, 22050, 44100)
MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB
REQUIRED_CHANNELS: int = 1

class FileValidator:
    """
    A utility class that provides comprehensive file validation functionality for the Femtosense Voice Command Generation system.

    This class addresses the following requirements:
    - High-Quality Audio Dataset Creation (Introduction/1.1 System Objectives/2): Ensure consistent audio quality across all generated files
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Validate files for AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Ensure files adhere to structured, easily accessible format

    Methods:
    - validate_audio_file: Validates an AudioFile instance for format, size, and metadata correctness.
    - validate_wav_format: Validates the WAV file format, checking sample rate, channels, and other properties.
    - validate_file_path: Validates if a file path adheres to the required storage structure.
    - validate_voice_command_structure: Validates the structure and content of a VoiceCommand instance.
    """

    @staticmethod
    def validate_audio_file(audio_file: AudioFile) -> bool:
        """
        Validates an AudioFile instance for format, size, and metadata correctness.

        Args:
            audio_file (AudioFile): The AudioFile instance to validate.

        Returns:
            bool: True if the audio file is valid, False otherwise.
        """
        # Check file size
        if len(audio_file.data) > MAX_FILE_SIZE:
            return False

        # Validate WAV format
        is_valid_wav, _ = FileValidator.validate_wav_format(audio_file.data)
        if not is_valid_wav:
            return False

        # Verify metadata consistency
        metadata = audio_file.metadata
        if metadata.file_format.lower() != 'wav':
            return False
        if metadata.file_size != len(audio_file.data):
            return False
        if metadata.sample_rate not in VALID_SAMPLE_RATES:
            return False

        return True

    @staticmethod
    def validate_wav_format(wav_data: bytes) -> Tuple[bool, str]:
        """
        Validates the WAV file format, checking sample rate, channels, and other properties.

        Args:
            wav_data (bytes): The raw WAV file data.

        Returns:
            Tuple[bool, str]: A tuple containing a boolean indicating validity and an error message if invalid.
        """
        try:
            with wave.open(BytesIO(wav_data), 'rb') as wav_file:
                # Check sample rate
                if wav_file.getframerate() not in VALID_SAMPLE_RATES:
                    return False, f"Invalid sample rate: {wav_file.getframerate()}"

                # Verify channel count
                if wav_file.getnchannels() != REQUIRED_CHANNELS:
                    return False, f"Invalid number of channels: {wav_file.getnchannels()}"

                # Additional checks can be added here (e.g., bit depth, duration)

            return True, "WAV format is valid"
        except wave.Error:
            return False, "Invalid WAV file format"

    @staticmethod
    def validate_file_path(file_path: str, config: StorageConfig) -> bool:
        """
        Validates if a file path adheres to the required storage structure.

        Args:
            file_path (str): The file path to validate.
            config (StorageConfig): The storage configuration to use for validation.

        Returns:
            bool: True if the file path is valid, False otherwise.
        """
        path_parts = Path(file_path).parts

        # Check if the path has the correct number of components
        if len(path_parts) != 5:  # bucket/language/intent/variation/file
            return False

        # Validate language code
        language = path_parts[1]
        if language not in config.file_structure['language']:
            return False

        # Check intent name format (assuming alphanumeric with underscores)
        intent = path_parts[2]
        if not intent.replace('_', '').isalnum():
            return False

        # Validate phrase variation structure
        variation = path_parts[3]
        if not variation.replace('-', '').replace('_', '').isalnum():
            return False

        # Ensure file naming follows convention (voice_profile.wav)
        file_name = path_parts[4]
        if not file_name.endswith('.wav') or '_' in file_name:
            return False

        return True

    @staticmethod
    def validate_voice_command_structure(command: VoiceCommand) -> bool:
        """
        Validates the structure and content of a VoiceCommand instance.

        Args:
            command (VoiceCommand): The VoiceCommand instance to validate.

        Returns:
            bool: True if the voice command structure is valid, False otherwise.
        """
        # Check completeness of command data
        if not all([command.id, command.phrase, command.intent, command.language]):
            return False

        # Validate relationships between commands and audio files
        for variation in command.variations:
            if not variation.phrase:
                return False
            for audio_file in variation.audio_files:
                if not FileValidator.validate_audio_file(audio_file):
                    return False

        # Verify language and intent consistency
        for variation in command.variations:
            for audio_file in variation.audio_files:
                if audio_file.metadata.language != command.language:
                    return False
                if audio_file.metadata.intent != command.intent:
                    return False

        return True

# Example usage:
# storage_config = StorageConfig()
# audio_file = AudioFile(...)  # Create an AudioFile instance
# is_valid_audio = FileValidator.validate_audio_file(audio_file)
#
# file_path = "femtosense-voice-commands/english/LIGHTS_ON/turn_on_the_lights/Matt.wav"
# is_valid_path = FileValidator.validate_file_path(file_path, storage_config)
#
# voice_command = VoiceCommand(...)  # Create a VoiceCommand instance
# is_valid_structure = FileValidator.validate_voice_command_structure(voice_command)