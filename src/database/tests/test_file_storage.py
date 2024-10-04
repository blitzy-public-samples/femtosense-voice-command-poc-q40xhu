import pytest
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch
from io import BytesIO

from src.database.src.file_storage.local_storage import LocalStorage
from src.database.src.file_storage.s3_storage import S3Storage
from src.database.src.file_storage.storage_factory import StorageFactory, StorageType
from src.database.src.config.storage_config import StorageConfig
from src.database.src.models.audio_file import AudioFile
from src.database.src.models.voice_command import VoiceCommand, VoiceCommandVariation
from src.database.src.models.metadata import Metadata

# Test data
TEST_AUDIO_DATA = b"test audio data"
TEST_METADATA = Metadata(
    created_at="2023-01-01T00:00:00",
    language="english",
    voice_profile="Matt",
    intent="LIGHTS_ON",
    original_phrase="Turn on the lights",
    variation="Could you please turn on the lights?",
    file_format="wav",
    file_size=len(TEST_AUDIO_DATA),
    duration=2.5,
    sample_rate=44100
)

@pytest.fixture
def storage_config():
    """Fixture for StorageConfig"""
    config = StorageConfig()
    config.local_root = Path(tempfile.mkdtemp())
    config.s3_bucket = "test-bucket"
    return config

@pytest.fixture
def sample_audio_file():
    """Fixture for sample AudioFile"""
    return AudioFile(data=TEST_AUDIO_DATA, metadata=TEST_METADATA)

@pytest.fixture
def sample_voice_command():
    """Fixture for sample VoiceCommand"""
    variation = VoiceCommandVariation(phrase="Could you please turn on the lights?")
    command = VoiceCommand(
        phrase="Turn on the lights",
        intent="LIGHTS_ON",
        language="english"
    )
    command.add_variation(variation)
    return command

class TestLocalStorage:
    """Test class for local storage implementation."""

    def test_save_audio_file(self, storage_config, sample_audio_file, sample_voice_command):
        """Tests saving an audio file to local storage."""
        local_storage = LocalStorage(storage_config)
        
        # Save the audio file
        file_path = local_storage.save_audio_file(sample_audio_file, sample_voice_command)
        
        # Verify file exists at expected path
        assert file_path.exists()
        
        # Verify file content matches original
        with open(file_path, 'rb') as f:
            assert f.read() == TEST_AUDIO_DATA

    def test_get_audio_file(self, storage_config, sample_audio_file, sample_voice_command):
        """Tests retrieving an audio file from local storage."""
        local_storage = LocalStorage(storage_config)
        
        # Save test audio file
        file_path = local_storage.save_audio_file(sample_audio_file, sample_voice_command)
        
        # Retrieve the audio file
        retrieved_file = local_storage.get_audio_file(file_path)
        
        # Verify retrieved file matches original
        assert retrieved_file.data == TEST_AUDIO_DATA
        assert retrieved_file.metadata == TEST_METADATA

    def test_delete_audio_file(self, storage_config, sample_audio_file, sample_voice_command):
        """Tests deleting an audio file from local storage."""
        local_storage = LocalStorage(storage_config)
        
        # Save test audio file
        file_path = local_storage.save_audio_file(sample_audio_file, sample_voice_command)
        
        # Delete the audio file
        local_storage.delete_audio_file(file_path)
        
        # Verify file no longer exists
        assert not file_path.exists()

    def test_list_audio_files(self, storage_config, sample_audio_file, sample_voice_command):
        """Tests listing audio files in local storage."""
        local_storage = LocalStorage(storage_config)
        
        # Save multiple test audio files
        file_path1 = local_storage.save_audio_file(sample_audio_file, sample_voice_command)
        file_path2 = local_storage.save_audio_file(sample_audio_file, sample_voice_command)
        
        # List audio files
        file_list = local_storage.list_audio_files()
        
        # Verify correct number and paths of files
        assert len(file_list) == 2
        assert file_path1 in file_list
        assert file_path2 in file_list

class TestS3Storage:
    """Test class for S3 storage implementation."""

    @patch('boto3.client')
    def test_upload_file(self, mock_s3_client, storage_config, sample_audio_file):
        """Tests uploading an audio file to S3."""
        s3_storage = S3Storage(storage_config)
        s3_storage.s3_client = mock_s3_client
        
        # Set up mock S3 client
        mock_s3_client.put_object.return_value = {}
        
        # Call upload_file method
        s3_uri = s3_storage.upload_file(sample_audio_file)
        
        # Verify correct S3 client calls
        mock_s3_client.put_object.assert_called_once()
        call_args = mock_s3_client.put_object.call_args[1]
        assert call_args['Bucket'] == storage_config.s3_bucket
        assert call_args['Key'].endswith(f"{TEST_METADATA.voice_profile}.{TEST_METADATA.file_format}")
        assert call_args['Body'].getvalue() == TEST_AUDIO_DATA
        assert call_args['ContentType'] == f"audio/{TEST_METADATA.file_format}"
        assert call_args['ServerSideEncryption'] == 'AES256'
        
        # Verify returned S3 URI
        assert s3_uri.startswith(f"s3://{storage_config.s3_bucket}/")

    @patch('boto3.client')
    def test_download_file(self, mock_s3_client, storage_config):
        """Tests downloading an audio file from S3."""
        s3_storage = S3Storage(storage_config)
        s3_storage.s3_client = mock_s3_client
        
        # Set up mock S3 client with test file
        mock_s3_client.get_object.return_value = {
            'Body': BytesIO(TEST_AUDIO_DATA),
            'ContentType': f"audio/{TEST_METADATA.file_format}",
            'Metadata': TEST_METADATA.to_dict()
        }
        
        # Call download_file method
        s3_uri = f"s3://{storage_config.s3_bucket}/test/file.wav"
        downloaded_file = s3_storage.download_file(s3_uri)
        
        # Verify correct S3 client calls
        mock_s3_client.get_object.assert_called_once_with(
            Bucket=storage_config.s3_bucket,
            Key="test/file.wav"
        )
        
        # Verify downloaded file content
        assert downloaded_file.data == TEST_AUDIO_DATA
        assert downloaded_file.metadata.to_dict() == TEST_METADATA.to_dict()

    @patch('boto3.client')
    def test_delete_file(self, mock_s3_client, storage_config):
        """Tests deleting an audio file from S3."""
        s3_storage = S3Storage(storage_config)
        s3_storage.s3_client = mock_s3_client
        
        # Set up mock S3 client
        mock_s3_client.delete_object.return_value = {}
        
        # Call delete_file method
        s3_uri = f"s3://{storage_config.s3_bucket}/test/file.wav"
        result = s3_storage.delete_file(s3_uri)
        
        # Verify correct S3 client delete call
        mock_s3_client.delete_object.assert_called_once_with(
            Bucket=storage_config.s3_bucket,
            Key="test/file.wav"
        )
        assert result is True

    @patch('boto3.client')
    def test_list_files(self, mock_s3_client, storage_config):
        """Tests listing audio files in S3 storage."""
        s3_storage = S3Storage(storage_config)
        s3_storage.s3_client = mock_s3_client
        
        # Set up mock S3 client with test files
        mock_s3_client.get_paginator.return_value.paginate.return_value = [
            {'Contents': [{'Key': 'file1.wav'}, {'Key': 'file2.wav'}]}
        ]
        
        # Call list_files method
        file_list = s3_storage.list_files()
        
        # Verify correct S3 client list call
        mock_s3_client.get_paginator.assert_called_once_with('list_objects_v2')
        mock_s3_client.get_paginator.return_value.paginate.assert_called_once_with(
            Bucket=storage_config.s3_bucket,
            Prefix=''
        )
        
        # Verify returned file list
        assert len(file_list) == 2
        assert all(f.startswith(f"s3://{storage_config.s3_bucket}/") for f in file_list)

class TestStorageFactory:
    """Test class for storage factory functionality."""

    def test_create_local_storage(self, storage_config):
        """Tests creation of local storage instance."""
        factory = StorageFactory(storage_config)
        storage = factory.create_storage(StorageType.LOCAL)
        assert isinstance(storage, LocalStorage)

    def test_create_s3_storage(self, storage_config):
        """Tests creation of S3 storage instance."""
        factory = StorageFactory(storage_config)
        storage = factory.create_storage(StorageType.S3)
        assert isinstance(storage, S3Storage)

    def test_get_default_storage(self, storage_config):
        """Tests retrieval of default storage instance."""
        factory = StorageFactory(storage_config)
        storage_config.default_storage_type = "s3"
        storage = factory.get_default_storage()
        assert isinstance(storage, S3Storage)

        storage_config.default_storage_type = "local"
        storage = factory.get_default_storage()
        assert isinstance(storage, LocalStorage)

if __name__ == "__main__":
    pytest.main()