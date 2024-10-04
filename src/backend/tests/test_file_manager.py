import pytest
from unittest.mock import MagicMock, patch
import tempfile
import os
from pathlib import Path
import boto3
from botocore.exceptions import ClientError

from ..core.file_manager import FileManager
from ..config.app_config import AppConfig
from ..utils.audio_converter import convert_to_wav

# Mock AWS credentials for testing
os.environ['AWS_ACCESS_KEY_ID'] = 'test_access_key'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'test_secret_key'

@pytest.fixture
def mock_s3_client():
    with patch('boto3.client') as mock_client:
        yield mock_client.return_value

@pytest.fixture
def sample_audio_data():
    return b'dummy audio data'

@pytest.fixture
def sample_metadata():
    return {
        'language': 'korean',
        'intent': 'LIGHTS_ON',
        'variation': 'turn_on_lights',
        'voice_id': 'voice1'
    }

@pytest.fixture
def file_manager(tmp_path):
    config = AppConfig()
    config.set('LOCAL_STORAGE_PATH', str(tmp_path))
    config.set('S3_BUCKET_NAME', 'test-bucket')
    return FileManager(config)

class TestFileManager:

    def test_init(self, file_manager):
        """
        Test the initialization of FileManager.
        Requirement: Scalable Data Management
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        assert isinstance(file_manager.local_base_path, Path)
        assert file_manager.bucket_name == 'test-bucket'

    def test_save_audio_file(self, file_manager, mock_s3_client, sample_audio_data, sample_metadata):
        """
        Test saving an audio file both locally and to S3.
        Requirement: Audio Dataset Creation, Structured Storage
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/2, Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        local_path, s3_path = file_manager.save_audio_file(sample_audio_data, sample_metadata)

        # Check local file
        assert Path(local_path).exists()
        assert Path(local_path).read_bytes() == sample_audio_data

        # Check S3 upload
        mock_s3_client.upload_file.assert_called_once()
        _, kwargs = mock_s3_client.upload_file.call_args
        assert kwargs['Bucket'] == 'test-bucket'
        assert kwargs['Key'] == s3_path
        assert kwargs['ExtraArgs']['Metadata'] == sample_metadata

    def test_get_audio_file_local(self, file_manager, sample_audio_data):
        """
        Test retrieving an audio file from local storage.
        Requirement: Scalable Data Management
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        test_file = file_manager.local_base_path / 'test_audio.wav'
        test_file.write_bytes(sample_audio_data)

        retrieved_data = file_manager.get_audio_file('test_audio.wav')
        assert retrieved_data == sample_audio_data

    def test_get_audio_file_s3(self, file_manager, mock_s3_client, sample_audio_data):
        """
        Test retrieving an audio file from S3.
        Requirement: Scalable Data Management
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        mock_s3_client.get_object.return_value = {'Body': MagicMock(read=lambda: sample_audio_data)}

        retrieved_data = file_manager.get_audio_file('non_existent_file.wav', prefer_local=False)
        assert retrieved_data == sample_audio_data
        mock_s3_client.get_object.assert_called_once()

    def test_delete_audio_file(self, file_manager, mock_s3_client):
        """
        Test deleting an audio file from both local storage and S3.
        Requirement: Scalable Data Management
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        test_file = file_manager.local_base_path / 'test_delete.wav'
        test_file.touch()

        success = file_manager.delete_audio_file('test_delete.wav')

        assert success
        assert not test_file.exists()
        mock_s3_client.delete_object.assert_called_once()

    def test_list_audio_files(self, file_manager, mock_s3_client):
        """
        Test listing audio files for a given intent and language.
        Requirement: Structured Storage
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        mock_s3_client.list_objects_v2.return_value = {
            'Contents': [
                {'Key': 'korean/LIGHTS_ON/file1.wav'},
                {'Key': 'korean/LIGHTS_ON/file2.wav'}
            ]
        }

        file_list = file_manager.list_audio_files('LIGHTS_ON', 'korean')

        assert len(file_list) == 2
        assert 'korean/LIGHTS_ON/file1.wav' in file_list
        assert 'korean/LIGHTS_ON/file2.wav' in file_list

    def test_generate_file_path(self, file_manager, sample_metadata):
        """
        Test the internal method for generating file paths.
        Requirement: Structured Storage
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        file_path = file_manager._generate_file_path(sample_metadata)
        expected_path = Path('korean/LIGHTS_ON/turn_on_lights_voice1.wav')
        assert file_path == expected_path

    @patch('src.backend.src.utils.audio_converter.convert_to_wav')
    def test_save_audio_file_conversion(self, mock_convert, file_manager, mock_s3_client, sample_audio_data, sample_metadata):
        """
        Test saving an audio file with format conversion.
        Requirement: Audio Dataset Creation
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/2
        """
        sample_metadata['variation'] = 'test_conversion.m4a'
        local_path, s3_path = file_manager.save_audio_file(sample_audio_data, sample_metadata)

        assert local_path.endswith('.wav')
        assert s3_path.endswith('.wav')
        mock_convert.assert_called_once()

    def test_save_audio_file_s3_error(self, file_manager, mock_s3_client, sample_audio_data, sample_metadata):
        """
        Test handling of S3 upload errors.
        Requirement: Scalable Data Management
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        mock_s3_client.upload_file.side_effect = ClientError({'Error': {'Code': 'TestException'}}, 'upload_file')

        with pytest.raises(ClientError):
            file_manager.save_audio_file(sample_audio_data, sample_metadata)

    def test_get_audio_file_not_found(self, file_manager, mock_s3_client):
        """
        Test handling of non-existent audio files.
        Requirement: Scalable Data Management
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        mock_s3_client.get_object.side_effect = ClientError({'Error': {'Code': 'NoSuchKey'}}, 'get_object')

        with pytest.raises(ClientError):
            file_manager.get_audio_file('non_existent_file.wav', prefer_local=False)

    def test_list_audio_files_empty(self, file_manager, mock_s3_client):
        """
        Test listing audio files when no files are present.
        Requirement: Structured Storage
        Location: Technical Specification/1.1 SYSTEM OBJECTIVES/3
        """
        mock_s3_client.list_objects_v2.return_value = {}

        file_list = file_manager.list_audio_files('EMPTY_INTENT', 'korean')

        assert len(file_list) == 0

def generate_test_audio_data():
    """
    Generates dummy audio data for testing purposes.
    """
    return b'RIFF' + b'\x00' * 36 + b'data' + b'\x00' * 4

def cleanup_test_files(temp_dir):
    """
    Cleans up temporary test files after test execution.
    """
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            os.remove(os.path.join(root, file))
    os.rmdir(temp_dir)

# Additional setup and teardown if needed
def setup_module(module):
    """Setup any state specific to the execution of the given module."""
    pass

def teardown_module(module):
    """Teardown any state that was previously setup with a setup_module method."""
    pass