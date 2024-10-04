from dataclasses import dataclass, field
from typing import List, Dict, Any
import uuid
from .audio_file import AudioFile
from .metadata import Metadata

@dataclass
class VoiceCommandVariation:
    """
    A dataclass that represents a variation of a voice command with its associated audio files.

    This class addresses the following requirements:
    - Automated Voice Command Variation Generation (Introduction/1.1 System Objectives/1): Create linguistically diverse yet semantically consistent variations of voice commands
    - High-Quality Audio Dataset Creation (Introduction/1.1 System Objectives/2): Generate professional-grade audio files using Femtosense's Text-to-Speech technology

    Attributes:
        id (str): Unique identifier for the variation.
        phrase (str): The variation of the voice command.
        audio_files (List[AudioFile]): List of associated audio files for this variation.
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    phrase: str
    audio_files: List[AudioFile] = field(default_factory=list)

    def add_audio_file(self, audio_file: AudioFile) -> None:
        """
        Adds a new audio file to the variation.

        Args:
            audio_file (AudioFile): The audio file to be added.
        """
        self.audio_files.append(audio_file)

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the variation to a dictionary format for storage or serialization.

        Returns:
            Dict[str, Any]: Dictionary representation of the variation
        """
        return {
            "id": self.id,
            "phrase": self.phrase,
            "audio_files": [audio_file.to_dict() for audio_file in self.audio_files]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'VoiceCommandVariation':
        """
        Creates a VoiceCommandVariation instance from a dictionary representation.

        Args:
            data (Dict[str, Any]): Dictionary containing VoiceCommandVariation information

        Returns:
            VoiceCommandVariation: A new VoiceCommandVariation instance
        """
        variation = cls(
            id=data.get("id", str(uuid.uuid4())),
            phrase=data["phrase"]
        )
        variation.audio_files = [AudioFile.from_dict(af_data) for af_data in data.get("audio_files", [])]
        return variation

@dataclass
class VoiceCommand:
    """
    A dataclass that represents a voice command with its variations and associated metadata.

    This class addresses the following requirements:
    - Automated Voice Command Variation Generation (Introduction/1.1 System Objectives/1): Create linguistically diverse yet semantically consistent variations of voice commands
    - Multi-language Support (Introduction/1.1 System Objectives/1): Support multiple languages including Korean, English, and Japanese
    - Data Management (Introduction/1.1 System Objectives/3): Implement robust AWS-based storage solution with structured data organization

    Attributes:
        id (str): Unique identifier for the voice command.
        phrase (str): The original voice command phrase.
        intent (str): The intent associated with the voice command.
        language (str): The language of the voice command.
        variations (List[VoiceCommandVariation]): List of variations for this voice command.
        is_distractor (bool): Flag indicating if this is a distractor command.
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    phrase: str
    intent: str
    language: str
    variations: List[VoiceCommandVariation] = field(default_factory=list)
    is_distractor: bool = False

    def add_variation(self, variation: VoiceCommandVariation) -> None:
        """
        Adds a new variation to the voice command.

        Args:
            variation (VoiceCommandVariation): The variation to be added.
        """
        self.variations.append(variation)

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the voice command to a dictionary format for storage or serialization.

        Returns:
            Dict[str, Any]: Dictionary representation of the voice command
        """
        return {
            "id": self.id,
            "phrase": self.phrase,
            "intent": self.intent,
            "language": self.language,
            "variations": [variation.to_dict() for variation in self.variations],
            "is_distractor": self.is_distractor
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'VoiceCommand':
        """
        Creates a VoiceCommand instance from a dictionary representation.

        Args:
            data (Dict[str, Any]): Dictionary containing VoiceCommand information

        Returns:
            VoiceCommand: A new VoiceCommand instance
        """
        command = cls(
            id=data.get("id", str(uuid.uuid4())),
            phrase=data["phrase"],
            intent=data["intent"],
            language=data["language"],
            is_distractor=data.get("is_distractor", False)
        )
        command.variations = [VoiceCommandVariation.from_dict(var_data) for var_data in data.get("variations", [])]
        return command

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
# variation = VoiceCommandVariation(phrase="Could you please turn on the lights?")
# variation.add_audio_file(audio_file)
#
# voice_command = VoiceCommand(
#     phrase="Turn on the lights",
#     intent="LIGHTS_ON",
#     language="english"
# )
# voice_command.add_variation(variation)
#
# # Convert to dictionary
# voice_command_dict = voice_command.to_dict()
#
# # Create from dictionary
# reconstructed_voice_command = VoiceCommand.from_dict(voice_command_dict)