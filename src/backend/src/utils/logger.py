import logging
import json
from datetime import datetime
from typing import Dict, Any

from ..config.logging_config import LoggingConfig

class CustomFormatter(logging.Formatter):
    """
    A custom formatter class for consistent log message formatting.
    
    Requirements addressed:
    - Logging Standards (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
    - Security Monitoring (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
    - Operational Monitoring (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)
    """

    def __init__(self, include_timestamp: bool = True):
        """
        Initialize the CustomFormatter.

        Args:
            include_timestamp (bool): Whether to include a timestamp in the log message.
        """
        self.include_timestamp = include_timestamp
        super().__init__()

    def format(self, record: logging.LogRecord) -> str:
        """
        Formats the log record into a standardized string format.

        Args:
            record (logging.LogRecord): The log record to be formatted.

        Returns:
            str: Formatted log message.
        """
        log_data: Dict[str, Any] = {
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        if self.include_timestamp:
            log_data["timestamp"] = datetime.utcnow().isoformat()

        if hasattr(record, 'extra'):
            log_data.update(record.extra)

        return json.dumps(log_data)

logger: logging.Logger = logging.getLogger(__name__)

def setup_logger(name: str, level: str) -> logging.Logger:
    """
    Initializes and configures a logger instance with the specified name and level.

    Args:
        name (str): The name of the logger.
        level (str): The logging level (e.g., "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL").

    Returns:
        logging.Logger: Configured logger instance.

    Requirements addressed:
    - Logging Standards (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
    - Operational Monitoring (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)
    """
    logger = logging.getLogger(name)
    logger.setLevel(level.upper())

    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)

    # Create file handler
    file_handler = logging.FileHandler(LoggingConfig.LOG_FILE_PATH)
    file_handler.setLevel(logging.INFO)

    # Create formatters
    console_formatter = CustomFormatter(include_timestamp=False)
    file_formatter = CustomFormatter(include_timestamp=True)

    # Set formatters for handlers
    console_handler.setFormatter(console_formatter)
    file_handler.setFormatter(file_formatter)

    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

def log_decorator(level: str):
    """
    A decorator function to automatically log function entry and exit.

    Args:
        level (str): The logging level for the decorator.

    Returns:
        function: Decorated function with logging capabilities.

    Requirements addressed:
    - Logging Standards (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
    - Security Monitoring (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            func_name = func.__name__
            logger.log(getattr(logging, level.upper()), f"Entering {func_name}")
            try:
                result = func(*args, **kwargs)
                logger.log(getattr(logging, level.upper()), f"Exiting {func_name}")
                return result
            except Exception as e:
                logger.exception(f"Exception in {func_name}: {str(e)}")
                raise
        return wrapper
    return decorator

# Initialize the global logger
logger = setup_logger(__name__, LoggingConfig.DEFAULT_LOG_LEVEL)