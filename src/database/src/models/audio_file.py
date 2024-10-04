from dataclasses import dataclass
from io import BytesIO
from typing import Dict, Any
from .metadata import Metadata

@dataclass
class AudioFile:
    """
    A dataclass that represents an audio file with its associated metadata in the voice command generation system.

    This class addresses the following requirements:
    - High-Quality Audio Dataset Creation (Introduction/1.1 System Objectives/2): Generate professional-grade audio files using Femtosense's Text-to-Speech technology
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Implement robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Organize generated data in a structured, easily accessible format

    Attributes:
        data (bytes): The raw audio data.
        metadata (Metadata): Associated metadata for the audio file.
    """

    data: bytes
    metadata: Metadata

    def to_binary_io(self) -> BytesIO:
        """
        Converts the audio data to a binary I/O stream for processing or transmission.

        Returns:
            io.BytesIO: Binary I/O stream containing the audio data
        """
        binary_io = BytesIO(self.data)
        binary_io.seek(0)
        return binary_io

    @classmethod
    def from_binary_io(cls, binary_io: BytesIO, metadata: Metadata) -> 'AudioFile':
        """
        Creates an AudioFile instance from a binary I/O stream and metadata.

        Args:
            binary_io (io.BytesIO): Binary I/O stream containing the audio data
            metadata (Metadata): Associated metadata for the audio file

        Returns:
            AudioFile: A new AudioFile instance
        """
        data = binary_io.getvalue()
        return cls(data=data, metadata=metadata)

    def get_file_path(self) -> str:
        """
        Generates the standardized file path for the audio file based on its metadata.

        Returns:
            str: Standardized file path for the audio file
        """
        return f"{self.metadata.language}/{self.metadata.intent}/{self.metadata.variation}/{self.metadata.voice_profile}.{self.metadata.file_format}"

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the AudioFile object to a dictionary format for storage or serialization.

        Returns:
            Dict[str, Any]: Dictionary representation of the AudioFile
        """
        return {
            "data": self.data,
            "metadata": self.metadata.to_dict()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AudioFile':
        """
        Creates an AudioFile instance from a dictionary representation.

        Args:
            data (Dict[str, Any]): Dictionary containing AudioFile information

        Returns:
            AudioFile: A new AudioFile instance
        """
        return cls(
            data=data["data"],
            metadata=Metadata.from_dict(data["metadata"])
        )

# Example usage:
# metadata = Metadata(
#     created_at=datetime.now(),
#     language="english",
#     voice_profile="Matt",
#     intent="LIGHTS_ON",
#     original_phrase="Turn on the lights",
#     variation="Could you please turn on the lights?",
#     file_format="wav",
#     file_size=1024000,
#     duration=2.5,
#     sample_rate=44100
# )
# audio_data = b"..." # Raw audio data
# audio_file = AudioFile(data=audio_data, metadata=metadata)
#
# # Convert to binary I/O
# binary_io = audio_file.to_binary_io()
#
# # Create from binary I/O
# reconstructed_audio_file = AudioFile.from_binary_io(binary_io, metadata)
#
# # Get file path
# file_path = audio_file.get_file_path()
#
# # Convert to dictionary
# audio_file_dict = audio_file.to_dict()
#
# # Create from dictionary
# reconstructed_audio_file = AudioFile.from_dict(audio_file_dict)