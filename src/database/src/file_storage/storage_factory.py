from enum import Enum
from typing import Union
from ..config.storage_config import StorageConfig
from ..models.audio_file import AudioFile
from .local_storage import LocalStorage
from .s3_storage import S3Storage

class StorageType(Enum):
    """
    Enum representing the available storage types.
    
    This addresses the requirement:
    - Hybrid Deployment Model (Technical Specification/5.1 DEPLOYMENT ENVIRONMENT): Support both local development and cloud storage
    """
    LOCAL = "local"
    S3 = "s3"

class StorageFactory:
    """
    A factory class that creates and manages storage instances based on the specified storage type.

    This class addresses the following requirements:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Implement robust storage solution with both local and cloud options
    - Hybrid Deployment Model (Technical Specification/5.1 DEPLOYMENT ENVIRONMENT): Support both local development and cloud storage
    - Storage Abstraction (Technical Specification/3.6 COMPONENT DETAILS): Provide a unified interface for different storage types
    """

    def __init__(self, config: StorageConfig):
        """
        Initializes the StorageFactory with the provided configuration.

        Args:
            config (StorageConfig): Configuration object containing storage settings.
        """
        self.config = config

    def create_storage(self, storage_type: StorageType) -> Union[LocalStorage, S3Storage]:
        """
        Creates and returns a storage instance based on the specified storage type.

        Args:
            storage_type (StorageType): The type of storage to create.

        Returns:
            Union[LocalStorage, S3Storage]: A storage instance of the specified type.

        Raises:
            ValueError: If an invalid storage type is provided.
        """
        if storage_type == StorageType.LOCAL:
            return LocalStorage(self.config)
        elif storage_type == StorageType.S3:
            return S3Storage(self.config)
        else:
            raise ValueError(f"Invalid storage type: {storage_type}")

    def get_default_storage(self) -> Union[LocalStorage, S3Storage]:
        """
        Returns the default storage instance based on configuration settings.

        Returns:
            Union[LocalStorage, S3Storage]: The default storage instance.
        """
        # Assuming the default storage type is specified in the config
        default_storage_type = StorageType(self.config.default_storage_type)
        return self.create_storage(default_storage_type)

# Example usage:
# config = StorageConfig()
# factory = StorageFactory(config)
#
# # Create a local storage instance
# local_storage = factory.create_storage(StorageType.LOCAL)
#
# # Create an S3 storage instance
# s3_storage = factory.create_storage(StorageType.S3)
#
# # Get the default storage instance
# default_storage = factory.get_default_storage()
#
# # Use the storage instances
# audio_file = AudioFile(...)  # Create an AudioFile instance
# local_storage.upload_file(audio_file)
# s3_storage.upload_file(audio_file)
# default_storage.upload_file(audio_file)