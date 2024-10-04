import pytest
from unittest.mock import MagicMock, patch
import boto3
from botocore.exceptions import ClientError

from ..src.services.aws_service import AWSService, generate_s3_path
from ..src.config.app_config import AppConfig
from ..src.utils.error_handler import FileSystemError

@pytest.fixture
def aws_service():
    """Fixture to create an instance of AWSService for testing."""
    config = AppConfig()
    return AWSService(config)

@pytest.fixture
def mock_s3_client():
    """Fixture to mock the S3 client."""
    with patch('boto3.client') as mock_client:
        yield mock_client.return_value

def generate_test_audio_data():
    """Generates mock audio data for testing purposes."""
    return b'mock audio data'

class TestAWSService:
    """
    A test class containing all test cases for the AWSService class.

    Requirements addressed:
    - Scalable Data Management Testing (Technical Specification/1.1 SYSTEM OBJECTIVES/3)
    - Structured Storage Validation (Technical Specification/1.1 SYSTEM OBJECTIVES/3)
    - AWS Integration Testing (Technical Specification/3.6 COMPONENT DETAILS/4)
    """

    def test_upload_audio_file(self, aws_service, mock_s3_client):
        """Tests the successful upload of an audio file to AWS S3."""
        # Arrange
        file_path = "test/path/audio.wav"
        audio_data = generate_test_audio_data()
        metadata = {"intent": "TEST_INTENT", "language": "en"}
        expected_url = f"https://{aws_service.bucket_name}.s3.amazonaws.com/{file_path}"

        # Act
        result = aws_service.upload_audio_file(file_path, audio_data, metadata)

        # Assert
        mock_s3_client.put_object.assert_called_once_with(
            Bucket=aws_service.bucket_name,
            Key=file_path,
            Body=audio_data,
            Metadata=metadata,
            ContentType='audio/wav'
        )
        assert result == expected_url

    def test_upload_audio_file_failure(self, aws_service, mock_s3_client):
        """Tests proper error handling when an upload fails."""
        # Arrange
        mock_s3_client.put_object.side_effect = ClientError(
            {'Error': {'Code': 'TestException', 'Message': 'Test error message'}},
            'PutObject'
        )

        # Act & Assert
        with pytest.raises(FileSystemError):
            aws_service.upload_audio_file("test/path/audio.wav", generate_test_audio_data(), {})

    def test_download_audio_file(self, aws_service, mock_s3_client):
        """Tests the successful download of an audio file from AWS S3."""
        # Arrange
        file_path = "test/path/audio.wav"
        expected_data = generate_test_audio_data()
        mock_s3_client.get_object.return_value = {'Body': MagicMock(read=lambda: expected_data)}

        # Act
        result = aws_service.download_audio_file(file_path)

        # Assert
        mock_s3_client.get_object.assert_called_once_with(
            Bucket=aws_service.bucket_name,
            Key=file_path
        )
        assert result == expected_data

    def test_download_audio_file_failure(self, aws_service, mock_s3_client):
        """Tests proper error handling when a download fails."""
        # Arrange
        mock_s3_client.get_object.side_effect = ClientError(
            {'Error': {'Code': 'TestException', 'Message': 'Test error message'}},
            'GetObject'
        )

        # Act & Assert
        with pytest.raises(FileSystemError):
            aws_service.download_audio_file("test/path/audio.wav")

    def test_delete_audio_file(self, aws_service, mock_s3_client):
        """Tests the successful deletion of an audio file from AWS S3."""
        # Arrange
        file_path = "test/path/audio.wav"

        # Act
        result = aws_service.delete_audio_file(file_path)

        # Assert
        mock_s3_client.delete_object.assert_called_once_with(
            Bucket=aws_service.bucket_name,
            Key=file_path
        )
        assert result is True

    def test_delete_audio_file_failure(self, aws_service, mock_s3_client):
        """Tests proper error handling when a deletion fails."""
        # Arrange
        mock_s3_client.delete_object.side_effect = ClientError(
            {'Error': {'Code': 'TestException', 'Message': 'Test error message'}},
            'DeleteObject'
        )

        # Act & Assert
        with pytest.raises(FileSystemError):
            aws_service.delete_audio_file("test/path/audio.wav")

    def test_list_audio_files(self, aws_service, mock_s3_client):
        """Tests the listing of audio files from a specific S3 prefix."""
        # Arrange
        prefix = "test/path/"
        expected_files = ["test/path/audio1.wav", "test/path/audio2.wav"]
        mock_s3_client.list_objects_v2.return_value = {
            'Contents': [{'Key': file} for file in expected_files]
        }

        # Act
        result = aws_service.list_audio_files(prefix)

        # Assert
        mock_s3_client.list_objects_v2.assert_called_once_with(
            Bucket=aws_service.bucket_name,
            Prefix=prefix
        )
        assert result == expected_files

    def test_list_audio_files_failure(self, aws_service, mock_s3_client):
        """Tests proper error handling when listing files fails."""
        # Arrange
        mock_s3_client.list_objects_v2.side_effect = ClientError(
            {'Error': {'Code': 'TestException', 'Message': 'Test error message'}},
            'ListObjectsV2'
        )

        # Act & Assert
        with pytest.raises(FileSystemError):
            aws_service.list_audio_files("test/path/")

    def test_generate_s3_path(self):
        """Tests the generation of standardized S3 paths."""
        # Arrange
        language = "en"
        intent = "LIGHTS_ON"
        variation = "turn-on-the-lights"
        voice_id = "en-US-1"

        # Act
        result = generate_s3_path(language, intent, variation, voice_id)

        # Assert
        expected_path = f"languages/{language}/intents/{intent}/variations/{variation}/{voice_id}.wav"
        assert result == expected_path

    def test_generate_s3_path_invalid_input(self):
        """Tests error handling for invalid input in generate_s3_path."""
        # Act & Assert
        with pytest.raises(ValueError):
            generate_s3_path("", "LIGHTS_ON", "turn-on-the-lights", "en-US-1")

    @pytest.mark.parametrize("config_override", [
        {"aws_config": {"credentials": {"access_key_id": "test_key", "secret_access_key": "test_secret"}}},
        {"aws_config": {"s3": {"region": "us-west-2", "bucket_name": "test-bucket"}}}
    ])
    def test_aws_service_initialization(self, config_override):
        """Tests AWSService initialization with different configurations."""
        # Arrange
        config = AppConfig()
        config.update(config_override)

        # Act
        with patch('boto3.client') as mock_boto3_client:
            aws_service = AWSService(config)

        # Assert
        mock_boto3_client.assert_called_once_with(
            's3',
            aws_access_key_id=config.aws_config['credentials']['access_key_id'],
            aws_secret_access_key=config.aws_config['credentials']['secret_access_key'],
            region_name=config.aws_config['s3']['region']
        )
        assert aws_service.bucket_name == config.aws_config['s3']['bucket_name']