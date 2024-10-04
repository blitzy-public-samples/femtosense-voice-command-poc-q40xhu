"""
Configuration file that defines the voice registry settings and constants for the Python backend
of the Femtosense Voice Command Generation PoC.

This module addresses the following requirements:
1. Multi-language Support (1.1 SYSTEM OBJECTIVES/1): Define available voices for Korean, English, and Japanese
2. Voice Profiles (1.1 SYSTEM OBJECTIVES/2): Provide diverse voice profiles for comprehensive training data
3. Structured Data Organization (3.2 HIGH-LEVEL ARCHITECTURE DIAGRAM): Organize voice profiles by language and region
"""

from typing import Dict, List, Any

# Define the structure for voice profiles
class VoiceProfile:
    def __init__(self, name: str, language: str, region: str = None, gender: str = None):
        self.name = name
        self.language = language
        self.region = region
        self.gender = gender

# Define the voice registry
VOICE_REGISTRY: Dict[str, Dict[str, List[str]]] = {
    "korean": {
        "default": [
            "Chae-Won", "Min-Ho", "Seo-Yeon", "Tae-Hee", "Joon-Gi",
            "In-Guk", "Hye-Rim", "Ji-Sung", "Jae-Hyun", "Yoo-Jung",
            "Ji-Yeon", "Bo-Young", "Da-Hee", "Hye-Kyo"
        ]
    },
    "english": {
        "uk": ["Beatrice", "Nelson", "Alfred"],
        "us": ["Matt", "Linda", "Betty"],
        "canada": ["Ryan", "Pamela"]
    },
    "japanese": {
        "default": [
            "Yuriko", "Akira", "Kasumi", "Kenichi", "Tomoka",
            "Takuya", "Takeshi", "Mariko", "Kei", "Ayami",
            "Hideaki", "Kaori", "Kenji", "Kuniko"
        ]
    }
}

# Define default voices for each language
DEFAULT_VOICES: Dict[str, str] = {
    "korean": "Chae-Won",
    "english": "Matt",
    "japanese": "Yuriko"
}

# Define supported languages
SUPPORTED_LANGUAGES: List[str] = ["korean", "english", "japanese"]

# Define voice quality settings
VOICE_QUALITY_SETTINGS: Dict[str, Any] = {
    "sample_rate": 44100,
    "bit_depth": 16,
    "channels": 1,
    "format": "wav"
}

def load_language_mappings() -> Dict[str, Dict[str, List[str]]]:
    """
    Loads the language mappings from the JSON file and returns the structured voice registry dictionary.

    Returns:
        Dict[str, Dict[str, List[str]]]: Structured voice registry dictionary
    """
    import json
    import os

    json_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'language_mappings.json')
    
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Validate the loaded data
        if not isinstance(data, dict):
            raise ValueError("Invalid JSON structure: expected a dictionary")
        
        for lang, regions in data.items():
            if not isinstance(regions, dict):
                raise ValueError(f"Invalid structure for language '{lang}': expected a dictionary of regions")
            for region, voices in regions.items():
                if not isinstance(voices, list):
                    raise ValueError(f"Invalid structure for region '{region}' in language '{lang}': expected a list of voices")
        
        return data
    except FileNotFoundError:
        print(f"Warning: language_mappings.json not found at {json_path}. Using default VOICE_REGISTRY.")
        return VOICE_REGISTRY
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in language_mappings.json. Using default VOICE_REGISTRY.")
        return VOICE_REGISTRY
    except ValueError as e:
        print(f"Error: {str(e)}. Using default VOICE_REGISTRY.")
        return VOICE_REGISTRY

def validate_voice_config(config: Dict[str, Any]) -> bool:
    """
    Validates the voice configuration structure and settings.

    Args:
        config (Dict[str, Any]): The voice configuration to validate

    Returns:
        bool: True if configuration is valid, False otherwise
    """
    # Check if all required languages are present
    if not all(lang in config for lang in SUPPORTED_LANGUAGES):
        print("Error: Not all supported languages are present in the configuration.")
        return False

    # Verify structure of voice profiles for each language
    for lang, regions in config.items():
        if not isinstance(regions, dict):
            print(f"Error: Invalid structure for language '{lang}'. Expected a dictionary of regions.")
            return False
        for region, voices in regions.items():
            if not isinstance(voices, list):
                print(f"Error: Invalid structure for region '{region}' in language '{lang}'. Expected a list of voices.")
                return False

    # Validate voice names against allowed patterns
    import re
    voice_pattern = re.compile(r'^[A-Z][a-z]+(-[A-Z][a-z]+)?$')
    for lang, regions in config.items():
        for region, voices in regions.items():
            for voice in voices:
                if not voice_pattern.match(voice):
                    print(f"Error: Invalid voice name '{voice}' in {lang}/{region}. Must be in the format 'Name' or 'Name-Name'.")
                    return False

    return True

# Load the voice registry from JSON file
VOICE_REGISTRY = load_language_mappings()

# Validate the loaded voice registry
if not validate_voice_config(VOICE_REGISTRY):
    print("Warning: Using default VOICE_REGISTRY due to validation errors.")
    VOICE_REGISTRY = {
        "korean": {"default": ["Chae-Won", "Min-Ho", "Seo-Yeon"]},
        "english": {"us": ["Matt", "Linda"], "uk": ["Beatrice"]},
        "japanese": {"default": ["Yuriko", "Akira", "Kasumi"]}
    }

# Ensure DEFAULT_VOICES are present in VOICE_REGISTRY
for lang, voice in DEFAULT_VOICES.items():
    if lang not in VOICE_REGISTRY or not any(voice in voices for voices in VOICE_REGISTRY[lang].values()):
        print(f"Warning: Default voice '{voice}' for language '{lang}' not found in VOICE_REGISTRY. Using first available voice.")
        DEFAULT_VOICES[lang] = next(iter(next(iter(VOICE_REGISTRY[lang].values()))))

print("Voice registry configuration loaded successfully.")