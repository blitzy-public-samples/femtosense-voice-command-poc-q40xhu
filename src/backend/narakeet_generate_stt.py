#!/usr/bin/env python3
"""
Femtosense Voice Command Generation Proof of Concept

This script is the main entry point for the Femtosense Voice Command Generation
Proof of Concept system. It orchestrates the entire process of generating voice
command variations and audio files.

Requirements addressed:
- Command Line Interface (Technical Specification/2.4 USER INTERFACE DESIGN)
- Automated Voice Command Generation (Technical Specification/1.1 SYSTEM OBJECTIVES/1)
- High-Quality Audio Dataset Creation (Technical Specification/1.1 SYSTEM OBJECTIVES/2)
- Scalable Data Management (Technical Specification/1.1 SYSTEM OBJECTIVES/3)

Author: Femtosense Development Team
Date: 2023-05-20
"""

import sys
from typing import Tuple, List, Dict, Any
from tqdm import tqdm

# Internal imports
from src.cli.command_line_parser import CommandLineParser
from src.core.input_processor import InputProcessor
from src.core.batch_processor import BatchProcessor
from src.services.aws_service import AWSService
from src.utils.logger import logger, log_decorator
from src.utils.error_handler import handle_error, ApiRequestError, ValidationError, FileSystemError
from src.config.app_config import AppConfig

@log_decorator(level="INFO")
def setup_services(config: AppConfig) -> Tuple[InputProcessor, BatchProcessor, AWSService]:
    """
    Initializes and configures all required services for the application.

    Args:
        config (AppConfig): Application configuration object.

    Returns:
        Tuple[InputProcessor, BatchProcessor, AWSService]: Initialized service instances.

    Raises:
        ApiRequestError: If there's an issue with API initialization.
        ValidationError: If there's an issue with input validation.
        FileSystemError: If there's an issue with file system operations.
    """
    try:
        input_processor = InputProcessor(config)
        batch_processor = BatchProcessor(config)
        aws_service = AWSService(config)
        return input_processor, batch_processor, aws_service
    except Exception as e:
        logger.error(f"Error setting up services: {str(e)}")
        raise

@log_decorator(level="INFO")
def process_commands(input_processor: InputProcessor, batch_processor: BatchProcessor, aws_service: AWSService, config: AppConfig) -> Dict[str, Any]:
    """
    Processes the input commands, generates variations, creates audio files, and uploads to AWS S3.

    Args:
        input_processor (InputProcessor): Instance of InputProcessor.
        batch_processor (BatchProcessor): Instance of BatchProcessor.
        aws_service (AWSService): Instance of AWSService.
        config (AppConfig): Application configuration object.

    Returns:
        Dict[str, Any]: Summary of the processing results.

    Raises:
        ApiRequestError: If there's an issue with API calls.
        ValidationError: If there's an issue with data validation.
        FileSystemError: If there's an issue with file system operations.
    """
    try:
        # Process input file
        commands = input_processor.process_input_file(config.input_file)
        logger.info(f"Processed {len(commands)} commands from input file")

        # Generate variations
        variations = batch_processor.generate_variations(commands)
        logger.info(f"Generated {len(variations)} variations")

        # Create audio files
        audio_files = batch_processor.create_audio_files(variations)
        logger.info(f"Created {len(audio_files)} audio files")

        # Upload files to AWS S3
        uploaded_files = aws_service.upload_files(audio_files)
        logger.info(f"Uploaded {len(uploaded_files)} files to AWS S3")

        return {
            "total_commands": len(commands),
            "total_variations": len(variations),
            "total_audio_files": len(audio_files),
            "total_uploaded_files": len(uploaded_files)
        }
    except Exception as e:
        logger.error(f"Error processing commands: {str(e)}")
        raise

@log_decorator(level="INFO")
def main() -> int:
    """
    The main function that orchestrates the entire voice command generation process.

    Returns:
        int: 0 for successful execution, non-zero for errors.
    """
    try:
        # Parse command line arguments
        parser = CommandLineParser()
        args = parser.parse_args()

        # Initialize configuration
        config = AppConfig(args)

        # Setup services
        input_processor, batch_processor, aws_service = setup_services(config)

        # Process commands
        summary = process_commands(input_processor, batch_processor, aws_service, config)

        # Display summary
        logger.info("Processing complete. Summary:")
        for key, value in summary.items():
            logger.info(f"{key}: {value}")

        return 0
    except (ApiRequestError, ValidationError, FileSystemError) as e:
        handle_error(e)
        return 1
    except Exception as e:
        handle_error(e)
        return 2

if __name__ == "__main__":
    sys.exit(main())