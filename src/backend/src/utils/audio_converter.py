import subprocess
import os
from typing import Tuple, Dict, Any
from .logger import logger, log_decorator
from .error_handler import FileSystemError, ValidationError

# Global constants
SUPPORTED_FORMATS: Tuple[str, ...] = ('m4a', 'wav')
DEFAULT_SAMPLE_RATE: int = 16000
DEFAULT_BIT_DEPTH: int = 16

@log_decorator(level="INFO")
def convert_audio(input_path: str, output_path: str, target_format: str, sample_rate: int = DEFAULT_SAMPLE_RATE, bit_depth: int = DEFAULT_BIT_DEPTH) -> bool:
    """
    Converts an audio file to the specified format using FFmpeg.

    Requirements addressed:
    - Audio Format Conversion (Technical Specification/2.1 PROGRAMMING LANGUAGES)
    - Audio Quality Control (Technical Specification/1.1 SYSTEM OBJECTIVES)

    Args:
        input_path (str): Path to the input audio file.
        output_path (str): Path where the converted audio file will be saved.
        target_format (str): The desired output format (e.g., 'wav', 'm4a').
        sample_rate (int): The desired sample rate for the output audio.
        bit_depth (int): The desired bit depth for the output audio.

    Returns:
        bool: True if conversion was successful, False otherwise.

    Raises:
        FileSystemError: If there are issues with file paths.
        ValidationError: If the target format is not supported.
    """
    try:
        # Validate input and output paths
        if not os.path.exists(input_path):
            raise FileSystemError(f"Input file does not exist: {input_path}")
        
        # Check if target format is supported
        if target_format not in SUPPORTED_FORMATS:
            raise ValidationError(f"Unsupported target format: {target_format}")
        
        # Construct FFmpeg command
        ffmpeg_command = [
            'ffmpeg',
            '-i', input_path,
            '-ar', str(sample_rate),
            '-acodec', 'pcm_s16le' if target_format == 'wav' else 'aac',
            '-b:a', f'{bit_depth}k',
            '-y',  # Overwrite output file if it exists
            output_path
        ]
        
        # Execute FFmpeg command
        result = subprocess.run(ffmpeg_command, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg conversion failed: {result.stderr}")
            return False
        
        logger.info(f"Audio conversion successful: {input_path} -> {output_path}")
        return True
    
    except (FileSystemError, ValidationError) as e:
        logger.error(f"Error during audio conversion: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during audio conversion: {str(e)}")
        return False

@log_decorator(level="DEBUG")
def validate_audio_file(file_path: str) -> bool:
    """
    Validates an audio file's format and quality parameters.

    Requirements addressed:
    - Audio Quality Control (Technical Specification/1.1 SYSTEM OBJECTIVES)

    Args:
        file_path (str): Path to the audio file to be validated.

    Returns:
        bool: True if the file is valid, False otherwise.

    Raises:
        FileSystemError: If there are issues with the file path.
    """
    try:
        if not os.path.exists(file_path):
            raise FileSystemError(f"File does not exist: {file_path}")
        
        # Extract file extension
        _, extension = os.path.splitext(file_path)
        if extension[1:].lower() not in SUPPORTED_FORMATS:
            logger.warning(f"Unsupported file format: {extension}")
            return False
        
        # Get audio metadata
        metadata = get_audio_metadata(file_path)
        
        # Validate sample rate and bit depth
        if int(metadata.get('sample_rate', 0)) < DEFAULT_SAMPLE_RATE:
            logger.warning(f"Sample rate below minimum: {metadata.get('sample_rate')}")
            return False
        
        if int(metadata.get('bit_depth', 0)) < DEFAULT_BIT_DEPTH:
            logger.warning(f"Bit depth below minimum: {metadata.get('bit_depth')}")
            return False
        
        logger.info(f"Audio file validated successfully: {file_path}")
        return True
    
    except FileSystemError as e:
        logger.error(f"Error validating audio file: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error validating audio file: {str(e)}")
        return False

@log_decorator(level="DEBUG")
def get_audio_metadata(file_path: str) -> Dict[str, Any]:
    """
    Retrieves metadata from an audio file using FFmpeg.

    Args:
        file_path (str): Path to the audio file.

    Returns:
        Dict[str, Any]: Dictionary containing audio metadata.

    Raises:
        FileSystemError: If there are issues with the file path.
    """
    try:
        if not os.path.exists(file_path):
            raise FileSystemError(f"File does not exist: {file_path}")
        
        # Construct FFmpeg command to extract metadata
        ffprobe_command = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            file_path
        ]
        
        # Execute FFprobe command
        result = subprocess.run(ffprobe_command, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFprobe metadata extraction failed: {result.stderr}")
            return {}
        
        # Parse FFprobe output
        metadata = subprocess.loads(result.stdout)
        
        # Extract relevant information
        audio_stream = next((stream for stream in metadata['streams'] if stream['codec_type'] == 'audio'), None)
        if not audio_stream:
            logger.warning(f"No audio stream found in file: {file_path}")
            return {}
        
        return {
            'sample_rate': audio_stream.get('sample_rate'),
            'bit_depth': audio_stream.get('bits_per_sample'),
            'codec': audio_stream.get('codec_name'),
            'duration': float(metadata['format'].get('duration', 0)),
            'bitrate': int(metadata['format'].get('bit_rate', 0)) // 1000  # Convert to kbps
        }
    
    except FileSystemError as e:
        logger.error(f"Error getting audio metadata: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting audio metadata: {str(e)}")
        return {}

@log_decorator(level="INFO")
def normalize_audio(input_path: str, output_path: str, target_db: float = -3.0) -> bool:
    """
    Normalizes the audio file to a target decibel level.

    Requirements addressed:
    - Audio Quality Control (Technical Specification/1.1 SYSTEM OBJECTIVES)

    Args:
        input_path (str): Path to the input audio file.
        output_path (str): Path where the normalized audio file will be saved.
        target_db (float): Target decibel level for normalization.

    Returns:
        bool: True if normalization was successful, False otherwise.

    Raises:
        FileSystemError: If there are issues with file paths.
    """
    try:
        # Validate input and output paths
        if not os.path.exists(input_path):
            raise FileSystemError(f"Input file does not exist: {input_path}")
        
        # Construct FFmpeg command for normalization
        ffmpeg_command = [
            'ffmpeg',
            '-i', input_path,
            '-filter:a', f'loudnorm=I={target_db}:TP=-1.5:LRA=11',
            '-y',  # Overwrite output file if it exists
            output_path
        ]
        
        # Execute FFmpeg command
        result = subprocess.run(ffmpeg_command, capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg normalization failed: {result.stderr}")
            return False
        
        logger.info(f"Audio normalization successful: {input_path} -> {output_path}")
        return True
    
    except FileSystemError as e:
        logger.error(f"Error during audio normalization: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during audio normalization: {str(e)}")
        return False