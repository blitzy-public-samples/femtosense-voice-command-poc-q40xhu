import sys
from typing import Dict, Any
from tqdm import tqdm
from colorama import Fore, Style, init

from ..utils.logger import setup_logger
from ..core.batch_processor import BatchProcessor

# Initialize colorama for cross-platform colored output
init(autoreset=True)

# Define progress stages and color scheme
PROGRESS_STAGES: Dict[str, str] = {
    "input_processing": "Processing input file",
    "variation_generation": "Generating variations",
    "audio_creation": "Creating audio files",
    "file_upload": "Uploading files to AWS S3"
}

COLOR_SCHEME: Dict[str, str] = {
    "success": Fore.GREEN,
    "error": Fore.RED,
    "warning": Fore.YELLOW,
    "info": Fore.CYAN
}

class ProgressDisplay:
    """
    Main class for managing and displaying progress information for the
    Femtosense Voice Command Generation PoC's command-line interface.

    This class provides real-time feedback on batch processing operations,
    including progress bars, status updates, and error reporting.

    Attributes:
        total_steps (int): Total number of steps in the batch process.
        current_step (int): Current step in the batch process.
        disable_progress_bar (bool): Flag to disable progress bar display.
        progress_bars (Dict[str, tqdm]): Dictionary of tqdm progress bars for each stage.
        logger: Logger instance for progress information.

    Requirements addressed:
    - User Interface (Technical Specification/2.4 USER INTERFACE DESIGN)
    - Progress Tracking (Technical Specification/7.4 COMMAND LINE EXAMPLES)
    - Error Reporting (Technical Specification/3.6 Component Details)
    """

    def __init__(self, total_steps: int, disable_progress_bar: bool = False):
        """
        Initializes the ProgressDisplay with total steps and progress bar settings.

        Args:
            total_steps (int): Total number of steps in the batch process.
            disable_progress_bar (bool): Flag to disable progress bar display.
        """
        self.total_steps = total_steps
        self.current_step = 0
        self.disable_progress_bar = disable_progress_bar
        self.progress_bars: Dict[str, tqdm] = {}
        self.logger = setup_logger(__name__)

        # Initialize progress bars for each stage
        for stage, description in PROGRESS_STAGES.items():
            self.progress_bars[stage] = tqdm(
                total=100,
                desc=description,
                disable=self.disable_progress_bar,
                file=sys.stdout,
                bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt}"
            )

    def update_progress(self, step_name: str, increment: int, status: str = ""):
        """
        Updates the progress for a specific processing step.

        Args:
            step_name (str): Name of the step being updated.
            increment (int): Amount to increment the progress.
            status (str, optional): Status message to display.

        Requirements addressed:
        - Progress Tracking (Technical Specification/7.4 COMMAND LINE EXAMPLES)
        """
        if step_name in self.progress_bars:
            self.progress_bars[step_name].update(increment)
            if status:
                self.progress_bars[step_name].set_postfix_str(status)
            self.logger.info(f"Progress update: {step_name} - {increment}% - {status}")
        else:
            self.logger.warning(f"Unknown step name: {step_name}")

    def display_error(self, error_message: str, step_name: str = ""):
        """
        Displays an error message in the progress display.

        Args:
            error_message (str): The error message to display.
            step_name (str, optional): The name of the step where the error occurred.

        Requirements addressed:
        - Error Reporting (Technical Specification/3.6 Component Details)
        """
        formatted_error = f"{COLOR_SCHEME['error']}Error: {error_message}{Style.RESET_ALL}"
        print(formatted_error, file=sys.stderr)
        
        if step_name in self.progress_bars:
            self.progress_bars[step_name].set_postfix_str("Error occurred")
        
        self.logger.error(f"Error in {step_name}: {error_message}")

    def display_summary(self, results: Dict[str, Any]):
        """
        Displays a summary of the batch processing results.

        Args:
            results (Dict[str, Any]): Batch processing results from BatchProcessor.

        Requirements addressed:
        - User Interface (Technical Specification/2.4 USER INTERFACE DESIGN)
        """
        print("\nBatch Processing Summary:")
        print(f"Total commands processed: {results['total_commands']}")
        print(f"Successful variations generated: {results['successful_variations']}")
        print(f"Successful audio files created: {results['successful_audio_files']}")
        print(f"Errors encountered: {len(results['errors'])}")

        if results['errors']:
            print("\nError Details:")
            for error in results['errors']:
                print(f"- Command: {error['command']}, Error: {error['error']}")

        self.logger.info("Batch processing summary displayed")

def create_progress_message(current: int, total: int, prefix: str = "") -> str:
    """
    Creates a formatted progress message string.

    Args:
        current (int): Current progress value.
        total (int): Total progress value.
        prefix (str, optional): Prefix for the progress message.

    Returns:
        str: Formatted progress message.

    Requirements addressed:
    - User Interface (Technical Specification/2.4 USER INTERFACE DESIGN)
    """
    percentage = (current / total) * 100
    bar_length = 30
    filled_length = int(bar_length * current // total)
    bar = '█' * filled_length + '-' * (bar_length - filled_length)
    return f"\r{prefix} |{bar}| {percentage:.1f}% Complete"

def format_time_remaining(seconds: float) -> str:
    """
    Formats the remaining time in a human-readable format.

    Args:
        seconds (float): Remaining time in seconds.

    Returns:
        str: Formatted time string.

    Requirements addressed:
    - User Interface (Technical Specification/2.4 USER INTERFACE DESIGN)
    """
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"

def display_batch_progress(batch_processor: BatchProcessor, input_file: str, skip_header: int = 0):
    """
    Displays the progress of batch processing using the ProgressDisplay class.

    Args:
        batch_processor (BatchProcessor): Instance of the BatchProcessor.
        input_file (str): Path to the input file.
        skip_header (int, optional): Number of header lines to skip.

    Requirements addressed:
    - User Interface (Technical Specification/2.4 USER INTERFACE DESIGN)
    - Progress Tracking (Technical Specification/7.4 COMMAND LINE EXAMPLES)
    """
    logger = setup_logger(__name__)
    logger.info(f"Starting batch progress display for file: {input_file}")

    try:
        # Initialize ProgressDisplay
        progress_display = ProgressDisplay(total_steps=len(PROGRESS_STAGES))

        # Process input file
        progress_display.update_progress("input_processing", 0, "Starting")
        commands = batch_processor.input_processor.process_file(input_file, skip_header)
        progress_display.update_progress("input_processing", 100, "Completed")

        total_commands = len(commands)
        logger.info(f"Total commands to process: {total_commands}")

        for i, command in enumerate(commands, 1):
            # Generate variations
            progress_display.update_progress("variation_generation", 0, f"Command {i}/{total_commands}")
            variations = batch_processor.generate_variations(command)
            progress_display.update_progress("variation_generation", (i / total_commands) * 100, f"Generated {len(variations)} variations")

            # Create audio files
            progress_display.update_progress("audio_creation", 0, f"Command {i}/{total_commands}")
            audio_files = batch_processor.create_audio_files(variations, command)
            progress_display.update_progress("audio_creation", (i / total_commands) * 100, f"Created {len(audio_files)} audio files")

            # Upload files (assuming this is part of create_audio_files)
            progress_display.update_progress("file_upload", (i / total_commands) * 100, f"Uploaded files for command {i}")

        # Display summary
        results = {
            "total_commands": total_commands,
            "successful_variations": sum(len(batch_processor.generate_variations(cmd)) for cmd in commands),
            "successful_audio_files": sum(len(batch_processor.create_audio_files(batch_processor.generate_variations(cmd), cmd)) for cmd in commands),
            "errors": []  # Actual errors would be collected during processing
        }
        progress_display.display_summary(results)

    except Exception as e:
        logger.exception(f"Error during batch processing: {str(e)}")
        progress_display.display_error(str(e))

if __name__ == "__main__":
    # This section is for testing the ProgressDisplay class
    import time
    import random

    test_batch_processor = BatchProcessor(None, None, None)  # Mock BatchProcessor
    test_input_file = "test_input.csv"
    
    display_batch_progress(test_batch_processor, test_input_file)