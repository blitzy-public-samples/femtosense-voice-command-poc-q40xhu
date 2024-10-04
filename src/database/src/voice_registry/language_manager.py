"""
Language Manager module for the Femtosense Voice Command Generation PoC.

This module is responsible for managing language-specific operations and configurations,
ensuring consistent language handling across the backend system.

Requirements addressed:
1. Multi-language Support (1.1 SYSTEM OBJECTIVES/1): Manage and validate language-specific operations for Korean, English, and Japanese
2. Voice Profiles (1.1 SYSTEM OBJECTIVES/2): Handle language-specific voice profile management
3. Structured Data Management (3.2 HIGH-LEVEL ARCHITECTURE DIAGRAM): Ensure consistent language handling and validation
"""

import logging
from typing import List, Dict, Optional
from ..config.voice_registry_config import VOICE_REGISTRY, SUPPORTED_LANGUAGES, DEFAULT_VOICES, VoiceProfile

# Initialize logger
logger = logging.getLogger(__name__)

class LanguageManager:
    """
    Manages language-specific operations and validations for voice commands.
    """

    def __init__(self):
        """
        Initialize the LanguageManager with the supported languages and voice registry.
        """
        self.supported_languages = SUPPORTED_LANGUAGES
        self.voice_registry = VOICE_REGISTRY
        self.default_voices = DEFAULT_VOICES
        logger.info(f"LanguageManager initialized with {len(self.supported_languages)} supported languages.")

    @property
    def supported_languages(self) -> List[str]:
        """
        Get the list of supported languages.

        Returns:
            List[str]: List of supported language codes.
        """
        return self._supported_languages

    @supported_languages.setter
    def supported_languages(self, languages: List[str]):
        """
        Set the list of supported languages.

        Args:
            languages (List[str]): List of language codes to set as supported.
        """
        self._supported_languages = languages
        logger.info(f"Supported languages updated: {', '.join(languages)}")

    def validate_language(self, language: str) -> bool:
        """
        Validates if the given language is supported by the system.

        Args:
            language (str): The language code to validate.

        Returns:
            bool: True if language is supported, False otherwise.
        """
        is_valid = language.lower() in self.supported_languages
        logger.info(f"Language validation for '{language}': {'Valid' if is_valid else 'Invalid'}")
        return is_valid

    def get_voices_for_language(self, language: str) -> List[str]:
        """
        Retrieves all available voices for a specific language.

        Args:
            language (str): The language code to retrieve voices for.

        Returns:
            List[str]: List of available voice names for the specified language.
        """
        if not self.validate_language(language):
            logger.warning(f"Attempted to get voices for unsupported language: {language}")
            return []

        voices = []
        for region_voices in self.voice_registry[language.lower()].values():
            voices.extend(region_voices)
        
        logger.info(f"Retrieved {len(voices)} voices for language '{language}'")
        return voices

    def get_default_voice(self, language: str) -> Optional[str]:
        """
        Returns the default voice for a given language.

        Args:
            language (str): The language code to get the default voice for.

        Returns:
            Optional[str]: Default voice name for the specified language, or None if not found.
        """
        if not self.validate_language(language):
            logger.warning(f"Attempted to get default voice for unsupported language: {language}")
            return None

        default_voice = self.default_voices.get(language.lower())
        if default_voice:
            logger.info(f"Default voice for '{language}': {default_voice}")
        else:
            logger.warning(f"No default voice found for language '{language}'")
        
        return default_voice

    def get_voice_profile(self, language: str, voice_name: str) -> Optional[VoiceProfile]:
        """
        Retrieves the VoiceProfile for a given language and voice name.

        Args:
            language (str): The language code.
            voice_name (str): The name of the voice.

        Returns:
            Optional[VoiceProfile]: VoiceProfile object if found, None otherwise.
        """
        if not self.validate_language(language):
            logger.warning(f"Attempted to get voice profile for unsupported language: {language}")
            return None

        for region, voices in self.voice_registry[language.lower()].items():
            if voice_name in voices:
                profile = VoiceProfile(name=voice_name, language=language, region=region)
                logger.info(f"Voice profile retrieved for '{voice_name}' in '{language}'")
                return profile

        logger.warning(f"Voice profile not found for '{voice_name}' in '{language}'")
        return None

    def get_voices_by_region(self, language: str, region: str) -> List[str]:
        """
        Retrieves voices for a specific language and region.

        Args:
            language (str): The language code.
            region (str): The region code.

        Returns:
            List[str]: List of voice names for the specified language and region.
        """
        if not self.validate_language(language):
            logger.warning(f"Attempted to get voices for unsupported language: {language}")
            return []

        voices = self.voice_registry[language.lower()].get(region, [])
        logger.info(f"Retrieved {len(voices)} voices for language '{language}' and region '{region}'")
        return voices

    def add_voice(self, voice_profile: VoiceProfile) -> bool:
        """
        Adds a new voice to the voice registry.

        Args:
            voice_profile (VoiceProfile): The voice profile to add.

        Returns:
            bool: True if the voice was added successfully, False otherwise.
        """
        if not self.validate_language(voice_profile.language):
            logger.warning(f"Attempted to add voice for unsupported language: {voice_profile.language}")
            return False

        region = voice_profile.region or 'default'
        if voice_profile.name not in self.voice_registry[voice_profile.language][region]:
            self.voice_registry[voice_profile.language][region].append(voice_profile.name)
            logger.info(f"Added new voice '{voice_profile.name}' for language '{voice_profile.language}' and region '{region}'")
            return True
        else:
            logger.warning(f"Voice '{voice_profile.name}' already exists for language '{voice_profile.language}' and region '{region}'")
            return False

    def remove_voice(self, language: str, voice_name: str) -> bool:
        """
        Removes a voice from the voice registry.

        Args:
            language (str): The language code.
            voice_name (str): The name of the voice to remove.

        Returns:
            bool: True if the voice was removed successfully, False otherwise.
        """
        if not self.validate_language(language):
            logger.warning(f"Attempted to remove voice for unsupported language: {language}")
            return False

        for region, voices in self.voice_registry[language].items():
            if voice_name in voices:
                voices.remove(voice_name)
                logger.info(f"Removed voice '{voice_name}' from language '{language}' and region '{region}'")
                return True

        logger.warning(f"Voice '{voice_name}' not found in language '{language}'")
        return False

# Example usage
if __name__ == "__main__":
    language_manager = LanguageManager()
    print(f"Supported languages: {language_manager.supported_languages}")
    print(f"Korean voices: {language_manager.get_voices_for_language('korean')}")
    print(f"Default English voice: {language_manager.get_default_voice('english')}")
    print(f"US English voices: {language_manager.get_voices_by_region('english', 'us')}")