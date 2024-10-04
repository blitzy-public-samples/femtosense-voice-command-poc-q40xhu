import pytest
from unittest.mock import Mock, patch
from typing import List

from src.database.src.data_access.audio_file_dao import AudioFileDAO
from src.database.src.data_access.voice_command_dao import VoiceCommandDAO
from src.database.src.models.audio_file import AudioFile
from src.database.src.models.voice_command import VoiceCommand, VoiceCommandVariation
from src.database.src.file_storage.storage_factory import StorageFactory, StorageType
from src.database.src.file_storage.s3_storage import S3Storage
from src.database.src.config.storage_config import StorageConfig

# Test fixtures
@pytest.fixture
def mock_storage_factory():
    factory = Mock(spec=StorageFactory)
    factory.get_default_storage.return_value = Mock(spec=S3Storage)
    factory.create_storage.return_value = Mock(spec=S3Storage)
    return factory

@pytest.fixture
def sample_audio_file():
    return AudioFile(
        file_path="test_audio.wav",
        file_size=1024,
        duration=1.5,
        sample_rate=16000,
        channels=1,
        bit_depth=16,
        metadata={
            "intent": "TEST_INTENT",
            "variation": "variation_1",
            "voice_profile": "voice_1"
        }
    )

@pytest.fixture
def sample_voice_command():
    return VoiceCommand(
        id="test_command_id",
        phrase="Test phrase",
        intent="TEST_INTENT",
        language="english",
        variations=[
            VoiceCommandVariation(id="variation_1", text="Test variation 1"),
            VoiceCommandVariation(id="variation_2", text="Test variation 2")
        ]
    )

# AudioFileDAO tests
def test_audio_file_dao_save(mock_storage_factory, sample_audio_file, sample_voice_command):
    """
    Tests the save functionality of AudioFileDAO.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    - High-Quality Audio Dataset (Introduction/1.1 System Objectives/2): Validate audio file handling and consistency
    """
    s3_storage = mock_storage_factory.get_default_storage()
    s3_storage.upload_file.return_value = "s3://test-bucket/test-path/test_audio.wav"

    audio_file_dao = AudioFileDAO(s3_storage)
    result = audio_file_dao.save_audio_file(sample_audio_file, sample_voice_command, "variation_1", "voice_1")

    assert result == "s3://test-bucket/test-path/test_audio.wav"
    s3_storage.upload_file.assert_called_once_with(sample_audio_file)
    assert sample_audio_file.metadata.intent == "TEST_INTENT"
    assert sample_audio_file.metadata.variation == "variation_1"
    assert sample_audio_file.metadata.voice_profile == "voice_1"

def test_audio_file_dao_get(mock_storage_factory, sample_audio_file, sample_voice_command):
    """
    Tests the retrieval functionality of AudioFileDAO.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    s3_storage = mock_storage_factory.get_default_storage()
    s3_storage.download_file.return_value = sample_audio_file

    audio_file_dao = AudioFileDAO(s3_storage)
    result = audio_file_dao.get_audio_file(sample_voice_command, "variation_1", "voice_1")

    assert result == sample_audio_file
    s3_storage.download_file.assert_called_once()
    assert "s3://" in s3_storage.download_file.call_args[0][0]
    assert "TEST_INTENT" in s3_storage.download_file.call_args[0][0]
    assert "variation_1" in s3_storage.download_file.call_args[0][0]
    assert "voice_1.wav" in s3_storage.download_file.call_args[0][0]

def test_audio_file_dao_delete(mock_storage_factory, sample_voice_command):
    """
    Tests the delete functionality of AudioFileDAO.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    s3_storage = mock_storage_factory.get_default_storage()
    s3_storage.delete_file.return_value = True

    audio_file_dao = AudioFileDAO(s3_storage)
    result = audio_file_dao.delete_audio_file(sample_voice_command, "variation_1", "voice_1")

    assert result is True
    s3_storage.delete_file.assert_called_once()
    assert "s3://" in s3_storage.delete_file.call_args[0][0]
    assert "TEST_INTENT" in s3_storage.delete_file.call_args[0][0]
    assert "variation_1" in s3_storage.delete_file.call_args[0][0]
    assert "voice_1.wav" in s3_storage.delete_file.call_args[0][0]

def test_audio_file_dao_list(mock_storage_factory, sample_voice_command):
    """
    Tests the list functionality of AudioFileDAO.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    s3_storage = mock_storage_factory.get_default_storage()
    s3_storage.list_files.return_value = [
        "s3://test-bucket/english/TEST_INTENT/variation_1/voice_1.wav",
        "s3://test-bucket/english/TEST_INTENT/variation_2/voice_2.wav"
    ]

    audio_file_dao = AudioFileDAO(s3_storage)
    result = audio_file_dao.list_audio_files(sample_voice_command)

    assert len(result) == 2
    assert all("s3://" in uri for uri in result)
    assert all("TEST_INTENT" in uri for uri in result)
    s3_storage.list_files.assert_called_once()
    assert "english/TEST_INTENT" in s3_storage.list_files.call_args[0][0]

# VoiceCommandDAO tests
def test_voice_command_dao_save(mock_storage_factory, sample_voice_command):
    """
    Tests the save functionality of VoiceCommandDAO.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    storage = mock_storage_factory.create_storage.return_value
    storage.upload_file.return_value = True

    voice_command_dao = VoiceCommandDAO(mock_storage_factory)
    result = voice_command_dao.save_voice_command(sample_voice_command)

    assert result is True
    storage.upload_file.assert_called_once()
    assert "english/TEST_INTENT/test_command_id.json" in storage.upload_file.call_args[0][0]
    assert "Test phrase" in storage.upload_file.call_args[0][1]

def test_voice_command_dao_get(mock_storage_factory, sample_voice_command):
    """
    Tests the retrieval functionality of VoiceCommandDAO.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    storage = mock_storage_factory.create_storage.return_value
    storage.download_file.return_value = sample_voice_command.to_json()

    voice_command_dao = VoiceCommandDAO(mock_storage_factory)
    result = voice_command_dao.get_voice_command("test_command_id")

    assert result.id == sample_voice_command.id
    assert result.phrase == sample_voice_command.phrase
    assert result.intent == sample_voice_command.intent
    assert result.language == sample_voice_command.language
    assert len(result.variations) == len(sample_voice_command.variations)
    storage.download_file.assert_called_once()
    assert "test_command_id.json" in storage.download_file.call_args[0][0]

def test_voice_command_dao_list(mock_storage_factory, sample_voice_command):
    """
    Tests the list functionality of VoiceCommandDAO.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    storage = mock_storage_factory.create_storage.return_value
    storage.list_files.return_value = ["english/TEST_INTENT/test_command_id.json"]
    storage.download_file.return_value = sample_voice_command.to_json()

    voice_command_dao = VoiceCommandDAO(mock_storage_factory)
    result = voice_command_dao.list_voice_commands(language="english", intent="TEST_INTENT")

    assert len(result) == 1
    assert result[0].id == sample_voice_command.id
    assert result[0].phrase == sample_voice_command.phrase
    assert result[0].intent == sample_voice_command.intent
    assert result[0].language == sample_voice_command.language
    storage.list_files.assert_called_once_with("english/TEST_INTENT/*.json")

def test_voice_command_dao_delete(mock_storage_factory):
    """
    Tests the delete functionality of VoiceCommandDAO.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    storage = mock_storage_factory.create_storage.return_value
    storage.delete_file.return_value = True

    voice_command_dao = VoiceCommandDAO(mock_storage_factory)
    result = voice_command_dao.delete_voice_command("test_command_id")

    assert result is True
    storage.delete_file.assert_called_once()
    assert "test_command_id.json" in storage.delete_file.call_args[0][0]

# Error handling and edge cases
def test_audio_file_dao_save_invalid_file(mock_storage_factory, sample_voice_command):
    """
    Tests error handling when saving an invalid audio file.
    
    Requirements addressed:
    - High-Quality Audio Dataset (Introduction/1.1 System Objectives/2): Validate audio file handling and consistency
    """
    s3_storage = mock_storage_factory.get_default_storage()
    audio_file_dao = AudioFileDAO(s3_storage)

    invalid_audio_file = AudioFile(file_path="invalid.wav", file_size=0, duration=0, sample_rate=0, channels=0, bit_depth=0)

    with pytest.raises(ValueError):
        audio_file_dao.save_audio_file(invalid_audio_file, sample_voice_command, "variation_1", "voice_1")

def test_voice_command_dao_get_nonexistent(mock_storage_factory):
    """
    Tests retrieval of a non-existent voice command.
    
    Requirements addressed:
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    storage = mock_storage_factory.create_storage.return_value
    storage.download_file.return_value = None

    voice_command_dao = VoiceCommandDAO(mock_storage_factory)
    result = voice_command_dao.get_voice_command("nonexistent_id")

    assert result is None

# Performance and scalability tests
@pytest.mark.parametrize("num_files", [10, 100, 1000])
def test_audio_file_dao_list_performance(mock_storage_factory, num_files):
    """
    Tests the performance of listing audio files with varying numbers of files.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    """
    s3_storage = mock_storage_factory.get_default_storage()
    s3_storage.list_files.return_value = [f"s3://test-bucket/file_{i}.wav" for i in range(num_files)]

    audio_file_dao = AudioFileDAO(s3_storage)
    result = audio_file_dao.list_audio_files()

    assert len(result) == num_files
    s3_storage.list_files.assert_called_once()

@pytest.mark.parametrize("num_commands", [10, 100, 1000])
def test_voice_command_dao_list_performance(mock_storage_factory, sample_voice_command, num_commands):
    """
    Tests the performance of listing voice commands with varying numbers of commands.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    """
    storage = mock_storage_factory.create_storage.return_value
    storage.list_files.return_value = [f"english/TEST_INTENT/command_{i}.json" for i in range(num_commands)]
    storage.download_file.return_value = sample_voice_command.to_json()

    voice_command_dao = VoiceCommandDAO(mock_storage_factory)
    result = voice_command_dao.list_voice_commands()

    assert len(result) == num_commands
    assert storage.list_files.call_count == 1
    assert storage.download_file.call_count == num_commands

# Concurrency tests
@pytest.mark.asyncio
async def test_concurrent_audio_file_saves(mock_storage_factory, sample_audio_file, sample_voice_command):
    """
    Tests concurrent saving of audio files.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    """
    s3_storage = mock_storage_factory.get_default_storage()
    s3_storage.upload_file.return_value = "s3://test-bucket/test-path/test_audio.wav"

    audio_file_dao = AudioFileDAO(s3_storage)

    async def save_file():
        return audio_file_dao.save_audio_file(sample_audio_file, sample_voice_command, "variation_1", "voice_1")

    results = await asyncio.gather(*[save_file() for _ in range(10)])

    assert all(result == "s3://test-bucket/test-path/test_audio.wav" for result in results)
    assert s3_storage.upload_file.call_count == 10

@pytest.mark.asyncio
async def test_concurrent_voice_command_saves(mock_storage_factory, sample_voice_command):
    """
    Tests concurrent saving of voice commands.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    """
    storage = mock_storage_factory.create_storage.return_value
    storage.upload_file.return_value = True

    voice_command_dao = VoiceCommandDAO(mock_storage_factory)

    async def save_command():
        return voice_command_dao.save_voice_command(sample_voice_command)

    results = await asyncio.gather(*[save_command() for _ in range(10)])

    assert all(result is True for result in results)
    assert storage.upload_file.call_count == 10

# Integration tests
@pytest.mark.integration
def test_end_to_end_voice_command_flow(mock_storage_factory, sample_voice_command):
    """
    Tests the end-to-end flow of saving, retrieving, and deleting a voice command.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    """
    storage = mock_storage_factory.create_storage.return_value
    storage.upload_file.return_value = True
    storage.download_file.return_value = sample_voice_command.to_json()
    storage.delete_file.return_value = True

    voice_command_dao = VoiceCommandDAO(mock_storage_factory)

    # Save
    save_result = voice_command_dao.save_voice_command(sample_voice_command)
    assert save_result is True

    # Retrieve
    retrieved_command = voice_command_dao.get_voice_command(sample_voice_command.id)
    assert retrieved_command.id == sample_voice_command.id
    assert retrieved_command.phrase == sample_voice_command.phrase

    # Delete
    delete_result = voice_command_dao.delete_voice_command(sample_voice_command.id)
    assert delete_result is True

    # Verify deletion
    storage.download_file.return_value = None
    deleted_command = voice_command_dao.get_voice_command(sample_voice_command.id)
    assert deleted_command is None

@pytest.mark.integration
def test_end_to_end_audio_file_flow(mock_storage_factory, sample_audio_file, sample_voice_command):
    """
    Tests the end-to-end flow of saving, retrieving, and deleting an audio file.
    
    Requirements addressed:
    - Scalable Data Management (Introduction/1.1 System Objectives/3): Verify robust AWS-based storage solution
    - Data Organization (Introduction/1.1 System Objectives/3): Test structured data organization and accessibility
    - High-Quality Audio Dataset (Introduction/1.1 System Objectives/2): Validate audio file handling and consistency
    """
    s3_storage = mock_storage_factory.get_default_storage()
    s3_storage.upload_file.return_value = "s3://test-bucket/test-path/test_audio.wav"
    s3_storage.download_file.return_value = sample_audio_file
    s3_storage.delete_file.return_value = True

    audio_file_dao = AudioFileDAO(s3_storage)

    # Save
    save_result = audio_file_dao.save_audio_file(sample_audio_file, sample_voice_command, "variation_1", "voice_1")
    assert save_result == "s3://test-bucket/test-path/test_audio.wav"

    # Retrieve
    retrieved_file = audio_file_dao.get_audio_file(sample_voice_command, "variation_1", "voice_1")
    assert retrieved_file.file_path == sample_audio_file.file_path
    assert retrieved_file.file_size == sample_audio_file.file_size

    # Delete
    delete_result = audio_file_dao.delete_audio_file(sample_voice_command, "variation_1", "voice_1")
    assert delete_result is True

    # Verify deletion
    s3_storage.download_file.return_value = None
    deleted_file = audio_file_dao.get_audio_file(sample_voice_command, "variation_1", "voice_1")
    assert deleted_file is None

# Run the tests
if __name__ == "__main__":
    pytest.main(["-v", __file__])