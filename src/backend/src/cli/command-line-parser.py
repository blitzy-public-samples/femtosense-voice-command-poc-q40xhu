import argparse
from pathlib import Path
from typing import Dict, Any, Optional

from ..config.app_config import APP_CONFIG, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE
from ..utils.logger import logger

CLI_OPTIONS: Dict[str, Dict[str, Any]] = {
    'apikey': {
        'help': 'Narakeet API key',
        'required': True
    },
    'language': {
        'help': f'Target language ({", ".join(SUPPORTED_LANGUAGES)})',
        'choices': SUPPORTED_LANGUAGES,
        'default': DEFAULT_LANGUAGE
    },
    'intent_csv': {
        'help': 'Path to input CSV file',
        'type': Path,
        'required': True
    },
    'outdir': {
        'help': 'Output directory for generated files',
        'type': Path,
        'required': True
    },
    'skip_header': {
        'help': 'Number of header lines to skip',
        'type': int,
        'default': 1
    }
}

DEFAULT_SKIP_HEADER: int = 1

class CommandLineParser:
    """
    Handles the parsing and validation of command line arguments for the Femtosense Voice Command Generation tool.

    This class addresses the following requirements:
    - 'Command Line Interface' from Technical Specification/2.4 USER INTERFACE DESIGN
    - 'Input Validation' from Technical Specification/7.4 COMMAND LINE EXAMPLES
    - 'Multi-language Support' from Technical Specification/1.1 SYSTEM OBJECTIVES/1
    """

    def __init__(self, config: 'AppConfig'):
        """
        Initializes the CommandLineParser with application configuration.

        Args:
            config (AppConfig): The application configuration instance.
        """
        self.config = config
        self.parser = self._create_parser()

    def _create_parser(self) -> argparse.ArgumentParser:
        """
        Creates and configures the argument parser with all required and optional arguments.

        Returns:
            argparse.ArgumentParser: Configured argument parser instance.
        """
        parser = argparse.ArgumentParser(description="Femtosense Voice Command Generation PoC")
        
        for option, details in CLI_OPTIONS.items():
            parser.add_argument(f'--{option}', **details)

        return parser

    def parse_arguments(self) -> argparse.Namespace:
        """
        Parses and validates the command line arguments.

        Returns:
            argparse.Namespace: Parsed and validated arguments.

        Raises:
            argparse.ArgumentTypeError: If any validation fails.
        """
        args = self.parser.parse_args()

        # Validate API key
        if args.apikey != self.config.get_api_key('narakeet'):
            raise argparse.ArgumentTypeError("Invalid Narakeet API key")

        # Validate input file
        self.validate_file_path(args.intent_csv)

        # Validate output directory
        self.validate_output_directory(args.outdir)

        logger.info(f"Command line arguments parsed successfully: {args}")
        return args

    def validate_file_path(self, file_path: Path) -> Path:
        """
        Validates that the provided file path exists and is accessible.

        Args:
            file_path (Path): The path of the file to validate.

        Returns:
            Path: Validated Path object.

        Raises:
            argparse.ArgumentTypeError: If the file does not exist or is not accessible.
        """
        if not file_path.is_file():
            raise argparse.ArgumentTypeError(f"Input file does not exist: {file_path}")
        if not file_path.suffix.lower() == '.csv':
            raise argparse.ArgumentTypeError(f"Input file must be a CSV file: {file_path}")
        return file_path

    def validate_output_directory(self, directory: Path) -> None:
        """
        Validates that the output directory exists or can be created.

        Args:
            directory (Path): The path of the output directory.

        Raises:
            argparse.ArgumentTypeError: If the directory cannot be created or is not writable.
        """
        try:
            directory.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            raise argparse.ArgumentTypeError(f"Cannot create or write to output directory: {directory}")

def create_cli_options() -> Dict[str, Dict[str, Any]]:
    """
    Creates a dictionary of all available CLI options with their descriptions and default values.

    Returns:
        Dict[str, Dict[str, Any]]: Dictionary of CLI options.
    """
    return CLI_OPTIONS

def validate_language(language: str) -> str:
    """
    Validates that the provided language is supported by the application.

    Args:
        language (str): The language to validate.

    Returns:
        str: Validated language string.

    Raises:
        ValueError: If the language is not supported.
    """
    if language not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language: {language}. Supported languages are: {', '.join(SUPPORTED_LANGUAGES)}")
    return language

# Example usage
if __name__ == "__main__":
    parser = CommandLineParser(APP_CONFIG)
    args = parser.parse_arguments()
    print(f"Parsed arguments: {args}")