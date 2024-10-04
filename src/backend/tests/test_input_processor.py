import pytest
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any
from ..src.core.input_processor import InputProcessor
from ..src.config.app_config import AppConfig
from ..src.utils.error_handler import ValidationError

class TestInputProcessor:
    """
    Test suite for the InputProcessor class.

    Requirements addressed:
    - Input Validation (Technical Specification/1.2.1 Core Functionalities)
    - Multi-language Support (Technical Specification/1.1 SYSTEM OBJECTIVES/1)
    - Intent Mapping (Technical Specification/1.2.1 Core Functionalities)
    """

    @pytest.fixture
    def input_processor(self):
        """Fixture to create an InputProcessor instance for each test."""
        config = AppConfig()
        return InputProcessor(config)

    def test_process_file_valid_input(self, input_processor, tmp_path):
        """
        Test successful processing of a valid input file.

        Steps:
        1. Create a test file with valid data
        2. Process file using InputProcessor
        3. Assert expected results
        """
        # Create a test CSV file
        test_file = create_test_file(tmp_path, [
            {"intent": "LIGHTS_ON", "phrase": "Turn on the lights", "language": "english"},
            {"intent": "LIGHTS_OFF", "phrase": "Turn off the lights", "language": "english"}
        ])

        # Process the file
        result = input_processor.process_file(str(test_file))

        # Assert the results
        assert len(result) == 2
        assert result[0] == {"intent": "LIGHTS_ON", "phrase": "Turn on the lights", "language": "english"}
        assert result[1] == {"intent": "LIGHTS_OFF", "phrase": "Turn off the lights", "language": "english"}

    def test_process_file_invalid_format(self, input_processor, tmp_path):
        """
        Test error handling for files with invalid format.

        Steps:
        1. Create a test file with invalid format
        2. Attempt to process file
        3. Assert ValidationError is raised
        """
        invalid_file = tmp_path / "invalid.txt"
        invalid_file.write_text("This is not a valid CSV or Excel file")

        with pytest.raises(ValidationError, match="Invalid file format"):
            input_processor.process_file(str(invalid_file))

    def test_process_file_missing_columns(self, input_processor, tmp_path):
        """
        Test error handling for files with missing required columns.

        Steps:
        1. Create a test file with missing columns
        2. Attempt to process file
        3. Assert ValidationError is raised
        """
        test_file = create_test_file(tmp_path, [
            {"intent": "LIGHTS_ON", "phrase": "Turn on the lights"}  # Missing 'language' column
        ])

        with pytest.raises(ValidationError, match="Missing required columns"):
            input_processor.process_file(str(test_file))

    def test_validate_row_valid(self, input_processor):
        """
        Test successful validation of a valid data row.

        Steps:
        1. Create valid row data
        2. Validate row using InputProcessor
        3. Assert expected validation results
        """
        valid_row = pd.Series({
            "intent": "VOLUME_UP",
            "phrase": "Increase the volume",
            "language": "english"
        })

        result = input_processor.validate_row(valid_row)

        assert result == {
            "intent": "VOLUME_UP",
            "phrase": "Increase the volume",
            "language": "english"
        }

    def test_validate_row_invalid_language(self, input_processor):
        """
        Test error handling for rows with unsupported languages.

        Steps:
        1. Create row data with invalid language
        2. Attempt to validate row
        3. Assert ValidationError is raised
        """
        invalid_row = pd.Series({
            "intent": "LIGHTS_ON",
            "phrase": "Turn on the lights",
            "language": "french"  # Assuming French is not in the supported languages
        })

        with pytest.raises(ValidationError, match="Unsupported language"):
            input_processor.validate_row(invalid_row)

    def test_map_intent(self, input_processor):
        """
        Test accurate mapping of phrases to intents.

        Steps:
        1. Test various phrase-intent mappings
        2. Assert correct intent assignments
        """
        assert input_processor.map_intent("Turn on the lights", "LIGHTS_ON") == "LIGHTS_ON"
        assert input_processor.map_intent("Increase volume", "VOLUME_UP") == "VOLUME_UP"
        assert input_processor.map_intent("What's the weather like?", "GET_WEATHER") == "GET_WEATHER"

    def test_sanitize_phrase(self, input_processor):
        """
        Test the phrase sanitization function.

        Steps:
        1. Test various input phrases
        2. Assert correct sanitization results
        """
        assert input_processor._sanitize_phrase("  Turn   on  the lights!  ") == "Turn on the lights"
        assert input_processor._sanitize_phrase("Volume up by 20%") == "Volume up by 20"
        assert input_processor._sanitize_phrase("Set alarm for 7:00 AM") == "Set alarm for 700 AM"

def create_test_file(tmp_path: Path, content: List[Dict[str, str]]) -> Path:
    """
    Helper function to create temporary test files with specified content.

    Args:
        tmp_path (Path): Temporary directory path.
        content (List[Dict[str, str]]): List of dictionaries representing file content.

    Returns:
        Path: Path to created test file.
    """
    df = pd.DataFrame(content)
    file_path = tmp_path / "test_input.csv"
    df.to_csv(file_path, index=False)
    return file_path

def test_is_valid_file(input_processor, tmp_path):
    """
    Tests the is_valid_file function for various file types.

    Steps:
    1. Test valid file extensions
    2. Test invalid file extensions
    3. Test non-existent files
    """
    # Valid file types
    assert input_processor._is_valid_file(str(tmp_path / "test.csv")) == True
    assert input_processor._is_valid_file(str(tmp_path / "test.xlsx")) == True
    assert input_processor._is_valid_file(str(tmp_path / "test.xls")) == True

    # Invalid file types
    assert input_processor._is_valid_file(str(tmp_path / "test.txt")) == False
    assert input_processor._is_valid_file(str(tmp_path / "test.pdf")) == False

    # Non-existent file (should still return True if extension is valid)
    assert input_processor._is_valid_file(str(tmp_path / "nonexistent.csv")) == True