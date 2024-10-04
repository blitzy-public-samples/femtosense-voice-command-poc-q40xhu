import os
from pathlib import Path
from typing import Dict

# Requirement: File Storage Configuration (Technical Specification/5.1 DEPLOYMENT ENVIRONMENT)
# Define storage settings for both local and S3 storage

# Temporary storage path
TEMP_STORAGE_PATH: str = os.getenv('FEMTOSENSE_TEMP_PATH', '/tmp/femtosense_poc')

# S3 Bucket name
# Requirement: AWS S3 Integration (Technical Specification/5.2 CLOUD SERVICES)
S3_BUCKET_NAME: str = os.getenv('FEMTOSENSE_S3_BUCKET', 'femtosense-voice-commands')

# AWS Region
AWS_REGION: str = os.getenv('FEMTOSENSE_AWS_REGION', 'us-west-2')

# File structure for S3 storage
# Requirement: File Structure Definition (Technical Specification/7.5 FILE STRUCTURE EXAMPLES)
FILE_STRUCTURE: Dict[str, str] = {
    'bucket': '{bucket_name}',
    'language': '{language}',
    'intent': '{intent}',
    'variation': '{phrase_variation}'
}

# Local storage root
LOCAL_STORAGE_ROOT: Path = Path.home() / 'femtosense' / 'voice_commands'

class StorageConfig:
    """
    Class that encapsulates all storage configuration settings.
    
    This class provides a centralized configuration for both local and S3 storage,
    ensuring consistency across the application.
    
    Requirements addressed:
    - File Storage Configuration (Technical Specification/5.1 DEPLOYMENT ENVIRONMENT)
    - AWS S3 Integration (Technical Specification/5.2 CLOUD SERVICES)
    - File Structure Definition (Technical Specification/7.5 FILE STRUCTURE EXAMPLES)
    """

    def __init__(self):
        self.temp_path: Path = Path(TEMP_STORAGE_PATH)
        self.s3_bucket: str = S3_BUCKET_NAME
        self.aws_region: str = AWS_REGION
        self.file_structure: Dict[str, str] = FILE_STRUCTURE
        self.local_root: Path = LOCAL_STORAGE_ROOT

    def get_temp_path(self, create: bool = False) -> Path:
        """
        Returns the temporary storage path and optionally creates it if it doesn't exist.

        Args:
            create (bool): If True, creates the directory if it doesn't exist.

        Returns:
            Path: The temporary storage path.
        """
        if create and not self.temp_path.exists():
            self.temp_path.mkdir(parents=True, exist_ok=True)
        return self.temp_path

    def get_s3_path(self, language: str, intent: str, variation: str) -> str:
        """
        Generates the full S3 path for a given audio file based on language, intent, and variation.

        Args:
            language (str): The language of the voice command.
            intent (str): The intent of the voice command.
            variation (str): The specific variation of the phrase.

        Returns:
            str: The full S3 path for the audio file.
        """
        return (
            f"{self.file_structure['bucket'].format(bucket_name=self.s3_bucket)}/"
            f"{self.file_structure['language'].format(language=language)}/"
            f"{self.file_structure['intent'].format(intent=intent)}/"
            f"{self.file_structure['variation'].format(phrase_variation=variation)}"
        )

    def get_local_path(self, language: str, intent: str, variation: str) -> Path:
        """
        Generates the full local path for a given audio file based on language, intent, and variation.

        Args:
            language (str): The language of the voice command.
            intent (str): The intent of the voice command.
            variation (str): The specific variation of the phrase.

        Returns:
            Path: The full local path for the audio file.
        """
        return self.local_root / language / intent / variation

    def validate_config(self):
        """
        Validates the storage configuration to ensure all required fields are present.

        Raises:
            ValueError: If any required configuration is missing.
        """
        if not self.s3_bucket:
            raise ValueError("S3 bucket name is not configured")
        if not self.aws_region:
            raise ValueError("AWS region is not configured")
        if not self.temp_path:
            raise ValueError("Temporary storage path is not configured")
        if not self.local_root:
            raise ValueError("Local storage root is not configured")

# Create a global instance of StorageConfig
storage_config = StorageConfig()

# Validate the configuration on module import
storage_config.validate_config()