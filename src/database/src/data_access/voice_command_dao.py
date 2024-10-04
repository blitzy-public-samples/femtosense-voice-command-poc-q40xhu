from typing import List, Optional, Union
import json
from ..models.voice_command import VoiceCommand, VoiceCommandVariation
from ..file_storage.storage_factory import StorageFactory, StorageType
from ..config.storage_config import StorageConfig
from ..utils.file_validator import validate_voice_command_structure

class VoiceCommandDAO:
    """
    A Data Access Object for managing voice command persistence and retrieval.

    This class addresses the following requirements:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Implement robust AWS-based storage solution
    - Structured Data Organization (Introduction/1.1 System Objectives/3): Organize generated data in a structured, easily accessible format
    - Efficient Data Retrieval (Introduction/1.1 System Objectives/3): Enable efficient retrieval of large audio datasets
    """

    def __init__(self, storage_factory: StorageFactory):
        """
        Initializes the DAO with a storage factory and sets up the default storage.

        Args:
            storage_factory (StorageFactory): Factory for creating storage instances
        """
        self.storage_factory = storage_factory
        self.default_storage = storage_factory.get_default_storage()

    def save_voice_command(self, command: VoiceCommand, storage_type: StorageType = StorageType.S3) -> bool:
        """
        Saves a voice command to the specified storage.

        Args:
            command (VoiceCommand): The voice command to be saved
            storage_type (StorageType): The type of storage to use (default: S3)

        Returns:
            bool: True if save successful, False otherwise
        """
        try:
            # Validate the voice command structure
            if not validate_voice_command_structure(command):
                raise ValueError("Invalid voice command structure")

            # Determine the storage to use
            storage = self.storage_factory.create_storage(storage_type)

            # Convert command to storable format
            command_data = json.dumps(command.to_dict())

            # Generate the file path for the voice command
            file_path = f"{command.language}/{command.intent}/{command.id}.json"

            # Save to storage
            return storage.upload_file(file_path, command_data)
        except Exception as e:
            # Log the error (assuming a logger is set up)
            print(f"Error saving voice command: {str(e)}")
            return False

    def get_voice_command(self, command_id: str, storage_type: StorageType = StorageType.S3) -> Optional[VoiceCommand]:
        """
        Retrieves a voice command by its ID from the specified storage.

        Args:
            command_id (str): The ID of the voice command to retrieve
            storage_type (StorageType): The type of storage to use (default: S3)

        Returns:
            Optional[VoiceCommand]: Retrieved voice command or None if not found
        """
        try:
            # Determine the storage to use
            storage = self.storage_factory.create_storage(storage_type)

            # Retrieve data from storage
            # Note: In a real implementation, we would need a way to determine the file path from just the ID
            # This might involve a separate index or a consistent naming convention
            file_path = f"*/*/{command_id}.json"
            command_data = storage.download_file(file_path)

            if command_data:
                # Convert data to VoiceCommand object if found
                command_dict = json.loads(command_data)
                return VoiceCommand.from_dict(command_dict)
            else:
                return None
        except Exception as e:
            # Log the error
            print(f"Error retrieving voice command: {str(e)}")
            return None

    def list_voice_commands(self, language: str = None, intent: str = None, storage_type: StorageType = StorageType.S3) -> List[VoiceCommand]:
        """
        Lists voice commands with optional filtering by language and intent.

        Args:
            language (str): Optional language filter
            intent (str): Optional intent filter
            storage_type (StorageType): The type of storage to use (default: S3)

        Returns:
            List[VoiceCommand]: List of voice commands matching the filters
        """
        try:
            # Determine the storage to use
            storage = self.storage_factory.create_storage(storage_type)

            # Apply filters to storage query
            file_path = "*/*/*.json"
            if language:
                file_path = f"{language}/*/*.json"
            if intent:
                file_path = f"*/{intent}/*.json" if not language else f"{language}/{intent}/*.json"

            # Retrieve matching commands
            command_files = storage.list_files(file_path)

            commands = []
            for file_path in command_files:
                command_data = storage.download_file(file_path)
                if command_data:
                    command_dict = json.loads(command_data)
                    commands.append(VoiceCommand.from_dict(command_dict))

            return commands
        except Exception as e:
            # Log the error
            print(f"Error listing voice commands: {str(e)}")
            return []

    def delete_voice_command(self, command_id: str, storage_type: StorageType = StorageType.S3) -> bool:
        """
        Deletes a voice command by its ID from the specified storage.

        Args:
            command_id (str): The ID of the voice command to delete
            storage_type (StorageType): The type of storage to use (default: S3)

        Returns:
            bool: True if deletion successful, False otherwise
        """
        try:
            # Determine the storage to use
            storage = self.storage_factory.create_storage(storage_type)

            # Delete command from storage
            # Note: Similar to get_voice_command, we need a way to determine the file path from just the ID
            file_path = f"*/*/{command_id}.json"
            return storage.delete_file(file_path)
        except Exception as e:
            # Log the error
            print(f"Error deleting voice command: {str(e)}")
            return False

# Example usage:
# config = StorageConfig()
# factory = StorageFactory(config)
# voice_command_dao = VoiceCommandDAO(factory)
#
# # Create a voice command
# command = VoiceCommand(
#     phrase="Turn on the lights",
#     intent="LIGHTS_ON",
#     language="english"
# )
#
# # Save the voice command
# success = voice_command_dao.save_voice_command(command)
#
# # Retrieve the voice command
# retrieved_command = voice_command_dao.get_voice_command(command.id)
#
# # List voice commands
# english_commands = voice_command_dao.list_voice_commands(language="english")
#
# # Delete the voice command
# deleted = voice_command_dao.delete_voice_command(command.id)