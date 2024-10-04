"""
A Python class that represents a voice profile in the Femtosense Voice Command Generation system,
providing a structured way to handle voice-specific attributes and functionality.

This module addresses the following requirements:
1. Voice Profiles (1.1 SYSTEM OBJECTIVES/2): Utilize diverse voice profiles for comprehensive training data
2. Multi-language Support (1.1 SYSTEM OBJECTIVES/1): Support multiple languages including Korean, English, and Japanese
3. Quality Control (1.1 SYSTEM OBJECTIVES/2): Ensure consistent audio quality across all generated files

Dependencies:
- VOICE_QUALITY_SETTINGS from ../config/voice_registry_config
"""

from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
import logging

from ..config.voice_registry_config import VOICE_QUALITY_SETTINGS, SUPPORTED_LANGUAGES

# Set up logging
logger = logging.getLogger(__name__)

@dataclass
class VoiceProfile:
    """
    A dataclass representing a voice profile with its attributes and capabilities.
    """
    id: str
    gender: str
    age_category: str
    region: str
    characteristics: List[str]
    language: str

    def __post_init__(self):
        """
        Validate the voice profile attributes after initialization.
        """
        if self.language not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language: {self.language}")
        
        if not self.id or not isinstance(self.id, str):
            raise ValueError("Invalid voice ID")
        
        if self.gender not in ['male', 'female', 'neutral']:
            raise ValueError(f"Invalid gender: {self.gender}")
        
        if self.age_category not in ['child', 'young_adult', 'adult', 'senior']:
            raise ValueError(f"Invalid age category: {self.age_category}")
        
        if not isinstance(self.characteristics, list):
            raise ValueError("Characteristics must be a list")

    @property
    def quality_settings(self) -> Dict[str, Any]:
        """
        Returns the voice quality settings for this profile.
        """
        return VOICE_QUALITY_SETTINGS

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the voice profile to a dictionary format for serialization.

        Returns:
            Dict[str, Any]: Dictionary representation of the voice profile
        """
        profile_dict = asdict(self)
        profile_dict['quality_settings'] = self.quality_settings
        return profile_dict

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'VoiceProfile':
        """
        Creates a VoiceProfile instance from a dictionary representation.

        Args:
            data (Dict[str, Any]): Dictionary containing voice profile data

        Returns:
            VoiceProfile: A new VoiceProfile instance
        """
        # Remove quality_settings from data if present, as it's not part of the __init__ parameters
        data.pop('quality_settings', None)
        try:
            return cls(**data)
        except TypeError as e:
            logger.error(f"Error creating VoiceProfile from dict: {e}")
            raise ValueError("Invalid data format for VoiceProfile")

    def is_compatible(self, language: str, gender: Optional[str] = None) -> bool:
        """
        Checks if this voice profile is compatible with given criteria.

        Args:
            language (str): The target language
            gender (Optional[str]): The target gender, if any

        Returns:
            bool: Whether the profile is compatible with the given criteria
        """
        if self.language != language:
            return False
        
        if gender and self.gender != gender:
            return False
        
        return True

    def __str__(self) -> str:
        """
        Returns a string representation of the VoiceProfile.
        """
        return f"VoiceProfile(id={self.id}, language={self.language}, gender={self.gender}, region={self.region})"

# Example usage and testing
if __name__ == "__main__":
    try:
        # Create a sample voice profile
        sample_profile = VoiceProfile(
            id="KR-F-01",
            gender="female",
            age_category="adult",
            region="seoul",
            characteristics=["clear", "professional"],
            language="korean"
        )
        
        print(f"Sample profile created: {sample_profile}")
        
        # Test to_dict method
        profile_dict = sample_profile.to_dict()
        print(f"Profile as dictionary: {profile_dict}")
        
        # Test from_dict method
        reconstructed_profile = VoiceProfile.from_dict(profile_dict)
        print(f"Reconstructed profile: {reconstructed_profile}")
        
        # Test compatibility
        print(f"Compatible with Korean female: {sample_profile.is_compatible('korean', 'female')}")
        print(f"Compatible with English: {sample_profile.is_compatible('english')}")
        
        # Test quality settings
        print(f"Quality settings: {sample_profile.quality_settings}")
        
    except Exception as e:
        logger.error(f"Error in VoiceProfile testing: {e}")
        raise