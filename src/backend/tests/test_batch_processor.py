import pytest
from unittest.mock import Mock, patch
from typing import Dict, Any, List, Tuple

from ..core.batch_processor import BatchProcessor, create_batch_report
from ..core.input_processor import InputProcessor
from ..core.file_manager import FileManager
from ..config.app_config import AppConfig
from ..utils.logger import setup_logger

@pytest.fixture
def mock_app_config():
    config = Mock(spec=AppConfig)
    config.get_batch_size.return_value = 100
    config.get_max_workers.return_value = 4
    return config

@pytest.fixture
def mock_input_processor():
    return Mock(spec=InputProcessor)

@pytest.fixture
def mock_file_manager():
    return Mock(spec=FileManager)

@pytest.fixture
def batch_processor(mock_app_config, mock_input_processor, mock_file_manager):
    return BatchProcessor(mock_app_config, mock_input_processor, mock_file_manager)

def test_process_batch_success(batch_processor, mock_input_processor, mock_file_manager):
    # Arrange
    input_file = "test_input.csv"
    mock_file_manager.validate_file.return_value = True
    mock_input_processor.process_file.return_value = [
        {"phrase": "Turn on the lights", "intent": "LIGHTS_ON", "language": "en"},
        {"phrase": "What's the weather like?", "intent": "WEATHER_QUERY", "language": "en"}
    ]
    batch_processor._process_command = Mock(return_value=(["variation1", "variation2"], [("local_path", "s3_path")]))

    # Act
    results = batch_processor.process_batch(input_file)

    # Assert
    assert results["total_commands"] == 2
    assert results["successful_variations"] == 4
    assert results["successful_audio_files"] == 2
    assert len(results["errors"]) == 0
    mock_file_manager.validate_file.assert_called_once_with(input_file)
    mock_input_processor.process_file.assert_called_once_with(input_file, 0)
    assert batch_processor._process_command.call_count == 2

def test_process_batch_invalid_input(batch_processor, mock_file_manager):
    # Arrange
    input_file = "invalid_input.csv"
    mock_file_manager.validate_file.return_value = False

    # Act & Assert
    with pytest.raises(ValueError, match=f"Invalid input file: {input_file}"):
        batch_processor.process_batch(input_file)

def test_process_batch_error_handling(batch_processor, mock_input_processor, mock_file_manager):
    # Arrange
    input_file = "test_input.csv"
    mock_file_manager.validate_file.return_value = True
    mock_input_processor.process_file.return_value = [
        {"phrase": "Turn on the lights", "intent": "LIGHTS_ON", "language": "en"},
        {"phrase": "What's the weather like?", "intent": "WEATHER_QUERY", "language": "en"}
    ]
    batch_processor._process_command = Mock(side_effect=[
        (["variation1", "variation2"], [("local_path", "s3_path")]),
        Exception("Test error")
    ])

    # Act
    results = batch_processor.process_batch(input_file)

    # Assert
    assert results["total_commands"] == 2
    assert results["successful_variations"] == 2
    assert results["successful_audio_files"] == 1
    assert len(results["errors"]) == 1
    assert results["errors"][0]["error"] == "Test error"

def test_generate_variations(batch_processor):
    # Arrange
    command = {"phrase": "Turn on the lights", "intent": "LIGHTS_ON", "language": "en"}
    batch_processor._call_gpt_api = Mock(return_value=[
        "Turn on the lights",
        "Switch the lights on",
        "Illuminate the room",
        "Activate the lighting",
        "Lights on, please"
    ])

    # Act
    variations = batch_processor.generate_variations(command)

    # Assert
    assert len(variations) == 5
    assert all("lights" in variation.lower() for variation in variations)
    batch_processor._call_gpt_api.assert_called_once_with("Turn on the lights")

def test_create_audio_files(batch_processor, mock_file_manager):
    # Arrange
    variations = ["Turn on the lights", "Switch the lights on"]
    metadata = {"intent": "LIGHTS_ON", "language": "en"}
    batch_processor._generate_audio = Mock(return_value=b'audio_data')
    mock_file_manager.save_audio_file.return_value = ("local_path", "s3_path")

    # Act
    audio_files = batch_processor.create_audio_files(variations, metadata)

    # Assert
    assert len(audio_files) == 2
    assert all(file == ("local_path", "s3_path") for file in audio_files)
    assert batch_processor._generate_audio.call_count == 2
    assert mock_file_manager.save_audio_file.call_count == 2

def test_create_batch_report():
    # Arrange
    results = {
        "total_commands": 10,
        "successful_variations": 45,
        "successful_audio_files": 40,
        "errors": [
            {"command": {"phrase": "Test phrase"}, "error": "Test error"}
        ]
    }

    # Act
    report = create_batch_report(results)

    # Assert
    assert "Total commands processed: 10" in report
    assert "Successful variations generated: 45" in report
    assert "Successful audio files created: 40" in report
    assert "Errors encountered: 1" in report
    assert "Command: {'phrase': 'Test phrase'}, Error: Test error" in report

@pytest.mark.parametrize("batch_size,max_workers", [(50, 2), (100, 4), (200, 8)])
def test_batch_processor_initialization(mock_input_processor, mock_file_manager, batch_size, max_workers):
    # Arrange
    config = Mock(spec=AppConfig)
    config.get_batch_size.return_value = batch_size
    config.get_max_workers.return_value = max_workers

    # Act
    processor = BatchProcessor(config, mock_input_processor, mock_file_manager)

    # Assert
    assert processor.batch_size == batch_size
    assert processor.max_workers == max_workers

@patch('concurrent.futures.ThreadPoolExecutor')
def test_process_batch_concurrency(mock_executor, batch_processor, mock_input_processor, mock_file_manager):
    # Arrange
    input_file = "test_input.csv"
    mock_file_manager.validate_file.return_value = True
    mock_input_processor.process_file.return_value = [
        {"phrase": f"Command {i}", "intent": f"INTENT_{i}", "language": "en"} for i in range(5)
    ]
    mock_future = Mock()
    mock_future.result.return_value = (["variation"], [("local_path", "s3_path")])
    mock_executor.return_value.__enter__.return_value.submit.return_value = mock_future

    # Act
    results = batch_processor.process_batch(input_file)

    # Assert
    assert results["total_commands"] == 5
    assert results["successful_variations"] == 5
    assert results["successful_audio_files"] == 5
    assert mock_executor.return_value.__enter__.return_value.submit.call_count == 5

if __name__ == "__main__":
    pytest.main()