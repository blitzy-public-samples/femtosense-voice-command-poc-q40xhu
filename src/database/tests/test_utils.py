import pytest
from pathlib import Path
from unittest.mock import Mock, patch
from io import BytesIO

from ..src.utils.file_validator import FileValidator
from ..src.utils.path_generator import PathGenerator
from ..src.models.audio_file import AudioFile
from ..src.models.voice_command import VoiceCommand
from ..src.config.storage_config import StorageConfig

# Test FileValidator
class TestFileValidator:
    @pytest.fixture
    def mock_audio_file(self):
        return Mock(spec=AudioFile)

    @pytest.fixture
    def mock_storage_config(self):
        return Mock(spec=StorageConfig)

    @pytest.fixture
    def mock_voice_command(self):
        return Mock(spec=VoiceCommand)

    def test_validate_audio_file(self, mock_audio_file):
        # Test case: Valid audio file
        mock_audio_file.data = b'0' * (10 * 1024 * 1024 - 1)  # Just under 10MB
        mock_audio_file.metadata.file_format = 'wav'
        mock_audio_file.metadata.file_size = len(mock_audio_file.data)
        mock_audio_file.metadata.sample_rate = 16000

        with patch('wave.open') as mock_wave_open:
            mock_wave_file = Mock()
            mock_wave_file.getframerate.return_value = 16000
            mock_wave_file.getnchannels.return_value = 1
            mock_wave_open.return_value.__enter__.return_value = mock_wave_file

            assert FileValidator.validate_audio_file(mock_audio_file) == True

        # Test case: Invalid file size
        mock_audio_file.data = b'0' * (10 * 1024 * 1024 + 1)  # Just over 10MB
        assert FileValidator.validate_audio_file(mock_audio_file) == False

        # Test case: Invalid file format
        mock_audio_file.data = b'0' * (10 * 1024 * 1024 - 1)
        mock_audio_file.metadata.file_format = 'mp3'
        assert FileValidator.validate_audio_file(mock_audio_file) == False

        # Test case: Invalid sample rate
        mock_audio_file.metadata.file_format = 'wav'
        mock_audio_file.metadata.sample_rate = 8000
        assert FileValidator.validate_audio_file(mock_audio_file) == False

    def test_validate_wav_format(self):
        # Test case: Valid WAV format
        valid_wav_data = b'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x00\x7D\x00\x00\x00\xFA\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        is_valid, _ = FileValidator.validate_wav_format(valid_wav_data)
        assert is_valid == True

        # Test case: Invalid WAV format
        invalid_wav_data = b'NOT_A_WAV_FILE'
        is_valid, error_message = FileValidator.validate_wav_format(invalid_wav_data)
        assert is_valid == False
        assert error_message == "Invalid WAV file format"

    def test_validate_file_path(self, mock_storage_config):
        mock_storage_config.file_structure = {'language': ['english', 'korean', 'japanese']}

        # Test case: Valid file path
        valid_path = "femtosense-voice-commands/english/LIGHTS_ON/turn_on_the_lights/Matt.wav"
        assert FileValidator.validate_file_path(valid_path, mock_storage_config) == True

        # Test case: Invalid language
        invalid_language_path = "femtosense-voice-commands/french/LIGHTS_ON/turn_on_the_lights/Matt.wav"
        assert FileValidator.validate_file_path(invalid_language_path, mock_storage_config) == False

        # Test case: Invalid intent format
        invalid_intent_path = "femtosense-voice-commands/english/LIGHTS ON/turn_on_the_lights/Matt.wav"
        assert FileValidator.validate_file_path(invalid_intent_path, mock_storage_config) == False

        # Test case: Invalid file name
        invalid_file_name_path = "femtosense-voice-commands/english/LIGHTS_ON/turn_on_the_lights/Matt_voice.wav"
        assert FileValidator.validate_file_path(invalid_file_name_path, mock_storage_config) == False

    def test_validate_voice_command_structure(self, mock_voice_command):
        # Test case: Valid voice command structure
        mock_voice_command.id = "1"
        mock_voice_command.phrase = "Turn on the lights"
        mock_voice_command.intent = "LIGHTS_ON"
        mock_voice_command.language = "english"
        mock_voice_command.variations = [
            Mock(phrase="Turn on the lights", audio_files=[Mock(spec=AudioFile)])
        ]

        with patch.object(FileValidator, 'validate_audio_file', return_value=True):
            assert FileValidator.validate_voice_command_structure(mock_voice_command) == True

        # Test case: Missing required fields
        mock_voice_command.id = None
        assert FileValidator.validate_voice_command_structure(mock_voice_command) == False

        # Test case: Invalid audio file
        mock_voice_command.id = "1"
        with patch.object(FileValidator, 'validate_audio_file', return_value=False):
            assert FileValidator.validate_voice_command_structure(mock_voice_command) == False

# Test PathGenerator
class TestPathGenerator:
    @pytest.fixture
    def mock_storage_config(self):
        return Mock(spec=StorageConfig)

    @pytest.fixture
    def path_generator(self, mock_storage_config):
        return PathGenerator(mock_storage_config)

    @pytest.fixture
    def mock_voice_command(self):
        return Mock(spec=VoiceCommand, language="english", intent="LIGHTS_ON")

    def test_generate_local_path(self, path_generator, mock_voice_command):
        mock_voice_command.language = "english"
        mock_voice_command.intent = "LIGHTS_ON"
        variation_id = "turn_on_the_lights"
        voice_id = "Matt"

        expected_path = Path("local/path/english/lights-on/turn-on-the-lights/matt.wav")
        path_generator.storage_config.get_local_path.return_value = Path("local/path/english/lights-on/turn-on-the-lights")

        result = path_generator.generate_local_path(mock_voice_command, variation_id, voice_id)
        assert result == expected_path

    def test_generate_s3_path(self, path_generator, mock_voice_command):
        mock_voice_command.language = "english"
        mock_voice_command.intent = "LIGHTS_ON"
        variation_id = "turn_on_the_lights"
        voice_id = "Matt"

        expected_path = "s3://bucket/english/lights-on/turn-on-the-lights/matt.wav"
        path_generator.storage_config.get_s3_path.return_value = "s3://bucket/english/lights-on/turn-on-the-lights"

        result = path_generator.generate_s3_path(mock_voice_command, variation_id, voice_id)
        assert result == expected_path

    def test_sanitize_path_component(self, path_generator):
        # Test case: Normal string
        assert path_generator.sanitize_path_component("Hello World") == "hello-world"

        # Test case: String with invalid characters
        assert path_generator.sanitize_path_component("Hello@World!") == "hello-world"

        # Test case: String with leading/trailing hyphens
        assert path_generator.sanitize_path_component("-Hello-World-") == "hello-world"

    def test_get_temp_path(self, path_generator):
        filename = "temp_file.wav"
        expected_path = Path("/tmp/femtosense_poc/temp_file.wav")
        path_generator.storage_config.get_temp_path.return_value = Path("/tmp/femtosense_poc")

        result = path_generator.get_temp_path(filename)
        assert result == expected_path

    def test_generate_path(self, path_generator):
        mock_audio_file = Mock(spec=AudioFile)
        mock_audio_file.metadata.original_phrase = "Turn on the lights"
        mock_audio_file.metadata.intent = "LIGHTS_ON"
        mock_audio_file.metadata.language = "english"
        mock_audio_file.metadata.variation = "turn_on_the_lights"
        mock_audio_file.metadata.voice_profile = "Matt"

        # Test case: Local storage
        expected_local_path = Path("local/path/english/lights-on/turn-on-the-lights/matt.wav")
        path_generator.storage_config.get_local_path.return_value = Path("local/path/english/lights-on/turn-on-the-lights")
        result = path_generator.generate_path(mock_audio_file, "local")
        assert result == expected_local_path

        # Test case: S3 storage
        expected_s3_path = "s3://bucket/english/lights-on/turn-on-the-lights/matt.wav"
        path_generator.storage_config.get_s3_path.return_value = "s3://bucket/english/lights-on/turn-on-the-lights"
        result = path_generator.generate_path(mock_audio_file, "s3")
        assert result == expected_s3_path

        # Test case: Invalid storage type
        with pytest.raises(ValueError):
            path_generator.generate_path(mock_audio_file, "invalid_storage")

if __name__ == "__main__":
    pytest.main()