from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, Any

@dataclass
class Metadata:
    """
    A dataclass that represents metadata for audio files generated in the voice command system.
    
    This class addresses the following requirements:
    - Data Management (Introduction/1.1 System Objectives/3): Implement robust AWS-based storage solution with structured, easily accessible format
    - File Organization (Introduction/1.1 System Objectives/3): Organize generated data in a structured format
    - Metadata Storage (Introduction/1.1 System Objectives/3): Enable efficient retrieval and management of large audio datasets
    """

    created_at: datetime
    language: str
    voice_profile: str
    intent: str
    original_phrase: str
    variation: str
    file_format: str
    file_size: int
    duration: float
    sample_rate: int

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the metadata object to a dictionary format for storage or serialization.

        Returns:
            Dict[str, Any]: Dictionary representation of the metadata
        """
        metadata_dict = asdict(self)
        metadata_dict['created_at'] = self.created_at.isoformat()
        return metadata_dict

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Metadata':
        """
        Creates a Metadata instance from a dictionary representation.

        Args:
            data (Dict[str, Any]): Dictionary containing metadata information

        Returns:
            Metadata: A new Metadata instance
        """
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        return cls(**data)

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
#
# metadata_dict = metadata.to_dict()
# reconstructed_metadata = Metadata.from_dict(metadata_dict)