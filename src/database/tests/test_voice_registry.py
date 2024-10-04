import pytest
from unittest.mock import patch, MagicMock
from src.database.src.voice_registry.voice_registry import VoiceRegistry
from src.database.src.voice_registry.voice_profile import VoiceProfile
from src.database.src.voice_registry.language_manager import LanguageManager
from src.database.src.config.voice_registry_config import VOICE_REGISTRY, SUPPORTED_LANGUAGES

# Test data
TEST_VOICE_PROFILES = {
    "korean-seoul-Voice1": VoiceProfile(
        id="korean-seoul-Voice1",
        gender="female",
        age_category="adult",
        region="seoul",
        characteristics=["clear", "friendly"],
        language="korean"
    ),
    "english-us-Voice2": VoiceProfile(
        id="english-us-Voice2",
        gender="male",
        age_category="adult",
        region="us",
        characteristics=["deep", "authoritative"],
        language="english"
    ),
    "japanese-tokyo-Voice3": VoiceProfile(
        id="japanese-tokyo-Voice3",
        gender="female",
        age_category="young_adult",
        region="tokyo",
        characteristics=["soft", "polite"],
        language="japanese"
    )
}

@pytest.fixture
def voice_registry():
    with patch.object(VoiceRegistry, '_load_voice_profiles'):
        registry = VoiceRegistry.get_instance()
        registry.voice_profiles = TEST_VOICE_PROFILES
        yield registry

@pytest.mark.unit
def test_voice_registry_singleton():
    """
    Tests that the VoiceRegistry class correctly implements the singleton pattern.
    
    Requirements addressed:
    - Structured Data Management (1.1 SYSTEM OBJECTIVES/3)
    """
    with patch.object(VoiceRegistry, '_load_voice_profiles'):
        instance1 = VoiceRegistry.get_instance()
        instance2 = VoiceRegistry.get_instance()
        
        assert instance1 is instance2
        assert instance1.voice_profiles == instance2.voice_profiles

@pytest.mark.unit
def test_get_voice_profile(voice_registry):
    """
    Tests the retrieval of voice profiles by ID.
    
    Requirements addressed:
    - Voice Profiles (1.1 SYSTEM OBJECTIVES/2)
    - Structured Data Management (1.1 SYSTEM OBJECTIVES/3)
    """
    profile = voice_registry.get_voice_profile("korean-seoul-Voice1")
    assert profile.id == "korean-seoul-Voice1"
    assert profile.language == "korean"
    
    with pytest.raises(ValueError):
        voice_registry.get_voice_profile("non-existent-voice")

@pytest.mark.parametrize("language,gender", [
    ("korean", "female"),
    ("english", None),
    ("japanese", "male")
])
def test_select_voice(voice_registry, language, gender):
    """
    Tests the voice selection functionality based on language and gender.
    
    Requirements addressed:
    - Multi-language Support (1.1 SYSTEM OBJECTIVES/1)
    - Voice Profiles (1.1 SYSTEM OBJECTIVES/2)
    """
    profile = voice_registry.select_voice(language, gender)
    assert profile.language == language
    if gender:
        assert profile.gender == gender

    with pytest.raises(ValueError):
        voice_registry.select_voice("unsupported_language")

@pytest.mark.unit
def test_get_all_voices(voice_registry):
    """
    Tests the retrieval of all voice profiles, optionally filtered by language.
    
    Requirements addressed:
    - Multi-language Support (1.1 SYSTEM OBJECTIVES/1)
    - Structured Data Management (1.1 SYSTEM OBJECTIVES/3)
    """
    all_voices = voice_registry.get_all_voices()
    assert len(all_voices) == 3
    
    korean_voices = voice_registry.get_all_voices("korean")
    assert len(korean_voices) == 1
    assert korean_voices[0].language == "korean"
    
    with pytest.raises(ValueError):
        voice_registry.get_all_voices("unsupported_language")

@pytest.mark.unit
def test_add_voice_profile(voice_registry):
    """
    Tests adding a new voice profile to the registry.
    
    Requirements addressed:
    - Voice Profiles (1.1 SYSTEM OBJECTIVES/2)
    - Quality Control (1.1 SYSTEM OBJECTIVES/2)
    """
    new_profile = VoiceProfile(
        id="english-uk-NewVoice",
        gender="female",
        age_category="adult",
        region="uk",
        characteristics=["clear", "professional"],
        language="english"
    )
    
    assert voice_registry.add_voice_profile(new_profile) == True
    assert "english-uk-NewVoice" in voice_registry.voice_profiles
    
    # Attempt to add the same profile again
    assert voice_registry.add_voice_profile(new_profile) == False

@pytest.mark.unit
def test_remove_voice_profile(voice_registry):
    """
    Tests removing a voice profile from the registry.
    
    Requirements addressed:
    - Voice Profiles (1.1 SYSTEM OBJECTIVES/2)
    - Structured Data Management (1.1 SYSTEM OBJECTIVES/3)
    """
    assert voice_registry.remove_voice_profile("korean-seoul-Voice1") == True
    assert "korean-seoul-Voice1" not in voice_registry.voice_profiles
    
    # Attempt to remove a non-existent profile
    assert voice_registry.remove_voice_profile("non-existent-voice") == False

@pytest.mark.unit
def test_update_voice_profile(voice_registry):
    """
    Tests updating an existing voice profile in the registry.
    
    Requirements addressed:
    - Voice Profiles (1.1 SYSTEM OBJECTIVES/2)
    - Quality Control (1.1 SYSTEM OBJECTIVES/2)
    """
    updated_profile = VoiceProfile(
        id="english-us-Voice2",
        gender="male",
        age_category="senior",
        region="us",
        characteristics=["deep", "authoritative", "wise"],
        language="english"
    )
    
    assert voice_registry.update_voice_profile("english-us-Voice2", updated_profile) == True
    assert voice_registry.voice_profiles["english-us-Voice2"].age_category == "senior"
    assert "wise" in voice_registry.voice_profiles["english-us-Voice2"].characteristics
    
    # Attempt to update a non-existent profile
    assert voice_registry.update_voice_profile("non-existent-voice", updated_profile) == False

@pytest.mark.unit
def test_get_voice_count(voice_registry):
    """
    Tests the voice count functionality, optionally filtered by language.
    
    Requirements addressed:
    - Multi-language Support (1.1 SYSTEM OBJECTIVES/1)
    - Structured Data Management (1.1 SYSTEM OBJECTIVES/3)
    """
    assert voice_registry.get_voice_count() == 3
    assert voice_registry.get_voice_count("korean") == 1
    assert voice_registry.get_voice_count("english") == 1
    assert voice_registry.get_voice_count("japanese") == 1
    
    with pytest.raises(ValueError):
        voice_registry.get_voice_count("unsupported_language")

@pytest.mark.unit
def test_voice_profile_compatibility(voice_registry):
    """
    Tests the compatibility checking functionality of voice profiles.
    
    Requirements addressed:
    - Multi-language Support (1.1 SYSTEM OBJECTIVES/1)
    - Voice Profiles (1.1 SYSTEM OBJECTIVES/2)
    """
    korean_profile = voice_registry.get_voice_profile("korean-seoul-Voice1")
    assert korean_profile.is_compatible("korean", "female") == True
    assert korean_profile.is_compatible("korean", "male") == False
    assert korean_profile.is_compatible("english", "female") == False
    
    english_profile = voice_registry.get_voice_profile("english-us-Voice2")
    assert english_profile.is_compatible("english", None) == True
    assert english_profile.is_compatible("english", "male") == True
    assert english_profile.is_compatible("english", "female") == False

if __name__ == "__main__":
    pytest.main()