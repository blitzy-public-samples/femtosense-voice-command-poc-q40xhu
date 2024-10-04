"""
A central registry system that manages and coordinates voice profiles for the Femtosense Voice Command Generation PoC,
providing a robust interface for voice selection and management across different languages.

This module addresses the following requirements:
1. Voice Profiles (1.1 SYSTEM OBJECTIVES/2): Utilize diverse voice profiles for comprehensive training data
2. Multi-language Support (1.1 SYSTEM OBJECTIVES/1): Support multiple languages including Korean, English, and Japanese
3. Quality Control (1.1 SYSTEM OBJECTIVES/2): Ensure consistent audio quality across all generated files
4. Structured Data Management (1.1 SYSTEM OBJECTIVES/3): Organize voice profiles in a structured, easily accessible format
"""

from typing import Dict, List, Optional
import logging
from .voice_profile import VoiceProfile
from .language_manager import LanguageManager
from ..config.voice_registry_config import VOICE_REGISTRY, SUPPORTED_LANGUAGES

# Set up logging
logger = logging.getLogger(__name__)

class VoiceRegistry:
    """
    A singleton class that manages voice profiles and provides interfaces for voice selection.
    """
    _instance = None

    def __init__(self):
        """
        Initialize the VoiceRegistry with voice profiles and a language manager.
        """
        if VoiceRegistry._instance is not None:
            raise RuntimeError("Attempt to create multiple VoiceRegistry instances")
        
        self.voice_profiles: Dict[str, VoiceProfile] = {}
        self.language_manager = LanguageManager()
        self._load_voice_profiles()
        logger.info("VoiceRegistry initialized successfully")

    @classmethod
    def get_instance(cls) -> 'VoiceRegistry':
        """
        Returns the singleton instance of the VoiceRegistry.

        Returns:
            VoiceRegistry: Singleton instance of VoiceRegistry
        """
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_voice_profiles(self):
        """
        Load voice profiles from the VOICE_REGISTRY configuration.
        """
        for language, regions in VOICE_REGISTRY.items():
            for region, voices in regions.items():
                for voice in voices:
                    profile = VoiceProfile(
                        id=f"{language}-{region}-{voice}",
                        gender="unknown",  # This should be updated with actual gender information
                        age_category="adult",  # This should be updated with actual age category
                        region=region,
                        characteristics=[],  # This should be updated with actual characteristics
                        language=language
                    )
                    self.voice_profiles[profile.id] = profile
        logger.info(f"Loaded {len(self.voice_profiles)} voice profiles")

    def get_voice_profile(self, voice_id: str) -> VoiceProfile:
        """
        Retrieves a voice profile by its ID.

        Args:
            voice_id (str): The ID of the voice profile to retrieve

        Returns:
            VoiceProfile: Voice profile matching the given ID

        Raises:
            ValueError: If the voice profile is not found
        """
        profile = self.voice_profiles.get(voice_id)
        if profile is None:
            logger.error(f"Voice profile not found for ID: {voice_id}")
            raise ValueError(f"Voice profile not found for ID: {voice_id}")
        logger.info(f"Retrieved voice profile: {profile}")
        return profile

    def select_voice(self, language: str, gender: Optional[str] = None) -> VoiceProfile:
        """
        Selects an appropriate voice profile based on language and optional gender.

        Args:
            language (str): The target language for the voice profile
            gender (Optional[str]): The preferred gender for the voice profile (if any)

        Returns:
            VoiceProfile: Selected voice profile matching criteria

        Raises:
            ValueError: If no suitable voice profile is found
        """
        if not self.language_manager.validate_language(language):
            logger.error(f"Invalid language specified: {language}")
            raise ValueError(f"Invalid language specified: {language}")

        compatible_profiles = [
            profile for profile in self.voice_profiles.values()
            if profile.is_compatible(language, gender)
        ]

        if not compatible_profiles:
            logger.error(f"No compatible voice profiles found for language: {language}, gender: {gender}")
            raise ValueError(f"No compatible voice profiles found for language: {language}, gender: {gender}")

        selected_profile = compatible_profiles[0]  # Simple selection strategy, can be improved
        logger.info(f"Selected voice profile: {selected_profile}")
        return selected_profile

    def get_all_voices(self, language: Optional[str] = None) -> List[VoiceProfile]:
        """
        Returns all available voice profiles, optionally filtered by language.

        Args:
            language (Optional[str]): The language to filter voices by (if specified)

        Returns:
            List[VoiceProfile]: List of voice profiles
        """
        if language:
            if not self.language_manager.validate_language(language):
                logger.error(f"Invalid language specified: {language}")
                raise ValueError(f"Invalid language specified: {language}")
            voices = [profile for profile in self.voice_profiles.values() if profile.language == language]
        else:
            voices = list(self.voice_profiles.values())

        logger.info(f"Retrieved {len(voices)} voice profiles" + (f" for language: {language}" if language else ""))
        return voices

    def add_voice_profile(self, profile: VoiceProfile) -> bool:
        """
        Adds a new voice profile to the registry.

        Args:
            profile (VoiceProfile): The voice profile to add

        Returns:
            bool: True if the profile was added successfully, False if it already exists
        """
        if profile.id in self.voice_profiles:
            logger.warning(f"Voice profile already exists: {profile.id}")
            return False
        
        self.voice_profiles[profile.id] = profile
        logger.info(f"Added new voice profile: {profile}")
        return True

    def remove_voice_profile(self, voice_id: str) -> bool:
        """
        Removes a voice profile from the registry.

        Args:
            voice_id (str): The ID of the voice profile to remove

        Returns:
            bool: True if the profile was removed successfully, False if it doesn't exist
        """
        if voice_id not in self.voice_profiles:
            logger.warning(f"Voice profile not found: {voice_id}")
            return False
        
        del self.voice_profiles[voice_id]
        logger.info(f"Removed voice profile: {voice_id}")
        return True

    def update_voice_profile(self, voice_id: str, updated_profile: VoiceProfile) -> bool:
        """
        Updates an existing voice profile in the registry.

        Args:
            voice_id (str): The ID of the voice profile to update
            updated_profile (VoiceProfile): The updated voice profile

        Returns:
            bool: True if the profile was updated successfully, False if it doesn't exist
        """
        if voice_id not in self.voice_profiles:
            logger.warning(f"Voice profile not found: {voice_id}")
            return False
        
        self.voice_profiles[voice_id] = updated_profile
        logger.info(f"Updated voice profile: {updated_profile}")
        return True

    def get_voice_count(self, language: Optional[str] = None) -> int:
        """
        Returns the count of voice profiles, optionally filtered by language.

        Args:
            language (Optional[str]): The language to filter voices by (if specified)

        Returns:
            int: Number of voice profiles
        """
        count = len(self.get_all_voices(language))
        logger.info(f"Voice profile count: {count}" + (f" for language: {language}" if language else ""))
        return count

# Example usage and testing
if __name__ == "__main__":
    registry = VoiceRegistry.get_instance()
    
    # Test getting all voices
    all_voices = registry.get_all_voices()
    print(f"Total voices: {len(all_voices)}")
    
    # Test getting voices for a specific language
    korean_voices = registry.get_all_voices("korean")
    print(f"Korean voices: {len(korean_voices)}")
    
    # Test selecting a voice
    try:
        selected_voice = registry.select_voice("english", "female")
        print(f"Selected English female voice: {selected_voice}")
    except ValueError as e:
        print(f"Error selecting voice: {e}")
    
    # Test adding a new voice profile
    new_profile = VoiceProfile(
        id="en-us-NewVoice",
        gender="male",
        age_category="young_adult",
        region="us",
        characteristics=["energetic", "clear"],
        language="english"
    )
    if registry.add_voice_profile(new_profile):
        print(f"Added new voice profile: {new_profile}")
    
    # Test updating a voice profile
    updated_profile = VoiceProfile(
        id="en-us-NewVoice",
        gender="male",
        age_category="adult",
        region="us",
        characteristics=["calm", "authoritative"],
        language="english"
    )
    if registry.update_voice_profile("en-us-NewVoice", updated_profile):
        print(f"Updated voice profile: {updated_profile}")
    
    # Test removing a voice profile
    if registry.remove_voice_profile("en-us-NewVoice"):
        print("Removed voice profile: en-us-NewVoice")
    
    # Test voice count
    print(f"Total voice count: {registry.get_voice_count()}")
    print(f"English voice count: {registry.get_voice_count('english')}")