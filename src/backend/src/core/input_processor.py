import pandas as pd
from typing import List, Dict, Any
from ..utils.logger import logger, log_decorator
from ..utils.error_handler import ValidationError
from ..config.app_config import APP_CONFIG

class InputProcessor:
    """
    Main class responsible for processing input files and validating their contents.

    Requirements addressed:
    - Input Processing (Technical Specification/1.2.1 Core Functionalities)
    - Intent Mapping (Technical Specification/1.2.1 Core Functionalities)
    - Data Validation (Technical Specification/2.2 DATABASE DESIGN)
    """

    def __init__(self, config: Any):
        """
        Initializes the InputProcessor with application configuration.

        Args:
            config (Any): Application configuration object.
        """
        self.config = config
        self.supported_languages: List[str] = APP_CONFIG.SUPPORTED_LANGUAGES
        self.required_columns: List[str] = ['intent', 'phrase', 'language']
        self.logger = logger.setup_logger(__name__, APP_CONFIG.DEFAULT_LOG_LEVEL)

    @log_decorator('info')
    def process_file(self, file_path: str, skip_header: int = 0) -> List[Dict[str, Any]]:
        """
        Processes an input file and returns a list of validated voice command dictionaries.

        Args:
            file_path (str): Path to the input file.
            skip_header (int): Number of header rows to skip.

        Returns:
            List[Dict[str, Any]]: List of validated voice command dictionaries.

        Raises:
            ValidationError: If the file format is invalid or required columns are missing.
        """
        if not self._is_valid_file(file_path):
            raise ValidationError(f"Invalid file format. Supported formats are CSV and Excel.")

        try:
            df = pd.read_csv(file_path, skiprows=skip_header) if file_path.endswith('.csv') else pd.read_excel(file_path, skiprows=skip_header)
        except Exception as e:
            self.logger.error(f"Error reading file {file_path}: {str(e)}")
            raise ValidationError(f"Error reading file: {str(e)}")

        if not all(col in df.columns for col in self.required_columns):
            missing_cols = set(self.required_columns) - set(df.columns)
            raise ValidationError(f"Missing required columns: {', '.join(missing_cols)}")

        validated_commands = []
        for _, row in df.iterrows():
            try:
                validated_row = self.validate_row(row)
                validated_commands.append(validated_row)
            except ValidationError as ve:
                self.logger.warning(f"Skipping invalid row: {str(ve)}")

        self.logger.info(f"Processed {len(validated_commands)} valid commands from {file_path}")
        return validated_commands

    @log_decorator('debug')
    def validate_row(self, row: pd.Series) -> Dict[str, Any]:
        """
        Validates a single row from the input file and transforms it into the required format.

        Args:
            row (pd.Series): A single row from the input DataFrame.

        Returns:
            Dict[str, Any]: Validated and transformed row data.

        Raises:
            ValidationError: If the row data is invalid.
        """
        intent = self.map_intent(row['phrase'], row['intent'])
        language = row['language'].lower()
        phrase = self._sanitize_phrase(row['phrase'])

        if language not in self.supported_languages:
            raise ValidationError(f"Unsupported language: {language}")

        if not intent or not phrase:
            raise ValidationError("Intent and phrase cannot be empty")

        return {
            'intent': intent,
            'phrase': phrase,
            'language': language
        }

    @log_decorator('debug')
    def map_intent(self, phrase: str, intent_column: str) -> str:
        """
        Maps a phrase to its corresponding intent based on the intent column.

        Args:
            phrase (str): The input phrase.
            intent_column (str): The intent provided in the input file.

        Returns:
            str: Mapped intent.
        """
        # For now, we'll use the intent provided in the file directly.
        # This method can be extended in the future to implement more complex intent mapping logic.
        return intent_column.strip().upper()

    @staticmethod
    def _is_valid_file(file_path: str) -> bool:
        """
        Checks if the provided file path is valid and has the correct extension.

        Args:
            file_path (str): The path of the file to be validated.

        Returns:
            bool: True if file is valid, False otherwise.
        """
        return file_path.endswith(('.csv', '.xlsx', '.xls'))

    @staticmethod
    def _sanitize_phrase(phrase: str) -> str:
        """
        Sanitizes an input phrase by removing invalid characters and normalizing whitespace.

        Args:
            phrase (str): The input phrase to be sanitized.

        Returns:
            str: Sanitized phrase.
        """
        # Remove leading/trailing whitespace and normalize internal whitespace
        sanitized = ' '.join(phrase.split())
        # Remove any non-alphanumeric characters except spaces
        sanitized = ''.join(char for char in sanitized if char.isalnum() or char.isspace())
        return sanitized

# Example usage:
# input_processor = InputProcessor(APP_CONFIG)
# validated_commands = input_processor.process_file('path/to/input/file.csv')