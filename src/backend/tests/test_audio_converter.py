import pytest
import os
from unittest.mock import patch, MagicMock
from ..src.utils.audio_converter import (
    convert_audio,
    validate_audio_file,
    get_audio_metadata,
    normalize_audio,
    SUPPORTED_FORMATS,
    DEFAULT_SAMPLE_RATE,
    DEFAULT_BIT_DEPTH
)
from ..src.utils.error_handler import FileSystemError, ValidationError

# Global test constants
TEST_SAMPLE_RATE = 16000
TEST_BIT_DEPTH = 16
TEST_TARGET_DB = -3.0

# Apply markers for better test organization
pytestmark = [pytest.mark.audio, pytest.mark.utils]

@pytest.fixture
def mock_audio_file(tmp_path):
    """
    Provides a mock audio file for testing.
    """
    file_path = tmp_path / "test_audio.m4a"
    file_path.write_bytes(b"mock audio content")
    return str(file_path)

@pytest.fixture
def mock_ffmpeg(monkeypatch):
    """
    Mocks FFmpeg subprocess calls for testing.
    """
    mock_run = MagicMock()
    mock_run.return_value.returncode = 0
    mock_run.return_value.stdout = '{"streams": [{"codec_type": "audio", "sample_rate": "16000", "bits_per_sample": "16"}], "format": {"duration": "10.5", "bit_rate": "128000"}}'
    monkeypatch.setattr("subprocess.run", mock_run)
    return mock_run

def test_convert_audio_success(tmp_path, mock_ffmpeg):
    """
    Tests successful audio conversion from M4A to WAV format.
    
    Requirements addressed:
    - Format Conversion Testing (Technical Specification/2.1 PROGRAMMING LANGUAGES)
    """
    input_path = str(tmp_path / "input.m4a")
    output_path = str(tmp_path / "output.wav")
    
    result = convert_audio(input_path, output_path, "wav", TEST_SAMPLE_RATE, TEST_BIT_DEPTH)
    
    assert result is True
    mock_ffmpeg.assert_called_once()
    assert "-ar 16000" in " ".join(mock_ffmpeg.call_args[0][0])
    assert "-acodec pcm_s16le" in " ".join(mock_ffmpeg.call_args[0][0])

def test_convert_audio_invalid_input(tmp_path):
    """
    Tests error handling when invalid input file is provided.
    """
    non_existent_file = str(tmp_path / "non_existent.m4a")
    output_path = str(tmp_path / "output.wav")
    
    with pytest.raises(FileSystemError) as exc_info:
        convert_audio(non_existent_file, output_path, "wav")
    
    assert "Input file does not exist" in str(exc_info.value)

def test_convert_audio_unsupported_format(mock_audio_file, tmp_path):
    """
    Tests error handling for unsupported output format.
    """
    output_path = str(tmp_path / "output.mp3")
    
    with pytest.raises(ValidationError) as exc_info:
        convert_audio(mock_audio_file, output_path, "mp3")
    
    assert "Unsupported target format" in str(exc_info.value)

def test_validate_audio_file(mock_audio_file, mock_ffmpeg):
    """
    Tests audio file validation functionality.
    
    Requirements addressed:
    - Audio Quality Testing (Technical Specification/1.1 SYSTEM OBJECTIVES)
    """
    result = validate_audio_file(mock_audio_file)
    
    assert result is True
    mock_ffmpeg.assert_called_once()

def test_validate_audio_file_unsupported_format(tmp_path):
    """
    Tests validation of unsupported audio format.
    """
    unsupported_file = tmp_path / "test.mp3"
    unsupported_file.write_bytes(b"mock mp3 content")
    
    result = validate_audio_file(str(unsupported_file))
    
    assert result is False

def test_validate_audio_file_low_quality(mock_audio_file, mock_ffmpeg):
    """
    Tests validation of low-quality audio file.
    """
    mock_ffmpeg.return_value.stdout = '{"streams": [{"codec_type": "audio", "sample_rate": "8000", "bits_per_sample": "8"}], "format": {}}'
    
    result = validate_audio_file(mock_audio_file)
    
    assert result is False

def test_get_audio_metadata(mock_audio_file, mock_ffmpeg):
    """
    Tests extraction of metadata from audio files.
    
    Requirements addressed:
    - Audio Processing Validation (Technical Specification/4.2 FRAMEWORKS AND LIBRARIES)
    """
    metadata = get_audio_metadata(mock_audio_file)
    
    assert metadata == {
        'sample_rate': '16000',
        'bit_depth': '16',
        'codec': None,
        'duration': 10.5,
        'bitrate': 128
    }
    mock_ffmpeg.assert_called_once()

def test_get_audio_metadata_file_not_found():
    """
    Tests error handling when file is not found for metadata extraction.
    """
    with pytest.raises(FileSystemError) as exc_info:
        get_audio_metadata("non_existent_file.wav")
    
    assert "File does not exist" in str(exc_info.value)

def test_normalize_audio(mock_audio_file, mock_ffmpeg, tmp_path):
    """
    Tests audio normalization functionality.
    
    Requirements addressed:
    - Audio Quality Testing (Technical Specification/1.1 SYSTEM OBJECTIVES)
    """
    output_path = str(tmp_path / "normalized.wav")
    
    result = normalize_audio(mock_audio_file, output_path, TEST_TARGET_DB)
    
    assert result is True
    mock_ffmpeg.assert_called_once()
    assert f"loudnorm=I={TEST_TARGET_DB}" in " ".join(mock_ffmpeg.call_args[0][0])

def test_normalize_audio_file_not_found(tmp_path):
    """
    Tests error handling when file is not found for normalization.
    """
    non_existent_file = str(tmp_path / "non_existent.wav")
    output_path = str(tmp_path / "normalized.wav")
    
    with pytest.raises(FileSystemError) as exc_info:
        normalize_audio(non_existent_file, output_path)
    
    assert "Input file does not exist" in str(exc_info.value)

def test_normalize_audio_ffmpeg_failure(mock_audio_file, mock_ffmpeg, tmp_path):
    """
    Tests error handling when FFmpeg fails during normalization.
    """
    mock_ffmpeg.return_value.returncode = 1
    mock_ffmpeg.return_value.stderr = "FFmpeg error"
    output_path = str(tmp_path / "normalized.wav")
    
    result = normalize_audio(mock_audio_file, output_path)
    
    assert result is False

# Additional tests to ensure comprehensive coverage

def test_convert_audio_ffmpeg_failure(mock_audio_file, mock_ffmpeg, tmp_path):
    """
    Tests error handling when FFmpeg fails during conversion.
    """
    mock_ffmpeg.return_value.returncode = 1
    mock_ffmpeg.return_value.stderr = "FFmpeg error"
    output_path = str(tmp_path / "output.wav")
    
    result = convert_audio(mock_audio_file, output_path, "wav")
    
    assert result is False

def test_validate_audio_file_no_audio_stream(mock_audio_file, mock_ffmpeg):
    """
    Tests validation when no audio stream is found in the file.
    """
    mock_ffmpeg.return_value.stdout = '{"streams": [{"codec_type": "video"}], "format": {}}'
    
    result = validate_audio_file(mock_audio_file)
    
    assert result is False

@pytest.mark.parametrize("format", SUPPORTED_FORMATS)
def test_convert_audio_supported_formats(mock_audio_file, mock_ffmpeg, tmp_path, format):
    """
    Tests conversion for all supported audio formats.
    """
    output_path = str(tmp_path / f"output.{format}")
    
    result = convert_audio(mock_audio_file, output_path, format)
    
    assert result is True
    mock_ffmpeg.assert_called_once()

def test_get_audio_metadata_empty_response(mock_audio_file, mock_ffmpeg):
    """
    Tests handling of empty metadata response from FFmpeg.
    """
    mock_ffmpeg.return_value.stdout = '{}'
    
    metadata = get_audio_metadata(mock_audio_file)
    
    assert metadata == {}

def test_normalize_audio_custom_target_db(mock_audio_file, mock_ffmpeg, tmp_path):
    """
    Tests normalization with a custom target dB level.
    """
    output_path = str(tmp_path / "normalized.wav")
    custom_db = -6.0
    
    result = normalize_audio(mock_audio_file, output_path, custom_db)
    
    assert result is True
    assert f"loudnorm=I={custom_db}" in " ".join(mock_ffmpeg.call_args[0][0])

# Error handling and edge case tests

def test_convert_audio_unexpected_error(mock_audio_file, mock_ffmpeg, tmp_path):
    """
    Tests handling of unexpected errors during conversion.
    """
    mock_ffmpeg.side_effect = Exception("Unexpected error")
    output_path = str(tmp_path / "output.wav")
    
    result = convert_audio(mock_audio_file, output_path, "wav")
    
    assert result is False

def test_validate_audio_file_unexpected_error(mock_audio_file, mock_ffmpeg):
    """
    Tests handling of unexpected errors during validation.
    """
    mock_ffmpeg.side_effect = Exception("Unexpected error")
    
    result = validate_audio_file(mock_audio_file)
    
    assert result is False

def test_get_audio_metadata_unexpected_error(mock_audio_file, mock_ffmpeg):
    """
    Tests handling of unexpected errors during metadata extraction.
    """
    mock_ffmpeg.side_effect = Exception("Unexpected error")
    
    metadata = get_audio_metadata(mock_audio_file)
    
    assert metadata == {}

def test_normalize_audio_unexpected_error(mock_audio_file, mock_ffmpeg, tmp_path):
    """
    Tests handling of unexpected errors during normalization.
    """
    mock_ffmpeg.side_effect = Exception("Unexpected error")
    output_path = str(tmp_path / "normalized.wav")
    
    result = normalize_audio(mock_audio_file, output_path)
    
    assert result is False