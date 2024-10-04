import os
import logging
from logging.handlers import RotatingFileHandler
from typing import Dict, Any, List
from ..utils.error_handler import ValidationError

# Global constants
LOG_LEVELS: Dict[str, int] = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL
}
DEFAULT_LOG_LEVEL: str = 'INFO'
LOG_FORMAT: str = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_DATE_FORMAT: str = '%Y-%m-%d %H:%M:%S'
LOG_FILE_PATH: str = os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'femtosense_voice_command.log')

class LogConfig:
    """
    A configuration class that encapsulates logging settings.
    
    Requirements addressed:
    - Logging Standards (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
    - Security Monitoring (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
    - Operational Monitoring (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)
    """

    def __init__(self, log_level: str):
        """
        Initializes the LogConfig with a specified log level.

        Args:
            log_level (str): The log level to use for the configuration.
        """
        self.log_level = log_level or DEFAULT_LOG_LEVEL
        self.handlers: List[logging.Handler] = []
        self.formatters: Dict[str, logging.Formatter] = {}

    def configure_logging(self) -> Dict[str, Any]:
        """
        Generates a logging configuration dictionary for use with logging.config.dictConfig.

        Returns:
            Dict[str, Any]: Logging configuration dictionary.
        """
        self.handlers = [self.get_file_handler(), self.get_console_handler()]
        self.formatters = {
            'default': logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT)
        }

        return {
            'version': 1,
            'disable_existing_loggers': False,
            'formatters': {
                'default': {
                    'format': LOG_FORMAT,
                    'datefmt': LOG_DATE_FORMAT
                }
            },
            'handlers': {
                'file': {
                    'class': 'logging.handlers.RotatingFileHandler',
                    'level': self.log_level,
                    'formatter': 'default',
                    'filename': LOG_FILE_PATH,
                    'maxBytes': 10485760,  # 10MB
                    'backupCount': 5
                },
                'console': {
                    'class': 'logging.StreamHandler',
                    'level': self.log_level,
                    'formatter': 'default',
                    'stream': 'ext://sys.stdout'
                }
            },
            'root': {
                'level': self.log_level,
                'handlers': ['file', 'console']
            }
        }

    def get_file_handler(self) -> logging.FileHandler:
        """
        Creates and configures a file handler for logging to files.

        Returns:
            logging.FileHandler: Configured file handler.
        """
        os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
        file_handler = RotatingFileHandler(
            LOG_FILE_PATH,
            maxBytes=10485760,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(self.log_level)
        file_handler.setFormatter(self.formatters['default'])
        return file_handler

    def get_console_handler(self) -> logging.StreamHandler:
        """
        Creates and configures a console handler for logging to stdout.

        Returns:
            logging.StreamHandler: Configured console handler.
        """
        console_handler = logging.StreamHandler()
        console_handler.setLevel(self.log_level)
        console_handler.setFormatter(self.formatters['default'])
        return console_handler

def get_log_level(level_name: str) -> int:
    """
    Retrieves the numeric logging level from a string level name.

    Args:
        level_name (str): The name of the log level.

    Returns:
        int: Numeric logging level.

    Raises:
        ValidationError: If the provided log level is invalid.
    """
    level = LOG_LEVELS.get(level_name.upper())
    if level is None:
        raise ValidationError(f"Invalid log level: {level_name}. Valid levels are: {', '.join(LOG_LEVELS.keys())}")
    return level

def setup_logging(log_level: str) -> None:
    """
    Initializes logging for the entire application using the specified configuration.

    Requirements addressed:
    - Logging Standards (Technical Specification/3. SYSTEM ARCHITECTURE/3.6 Component Details)
    - Security Monitoring (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
    - Operational Monitoring (Technical Specification/5. INFRASTRUCTURE/5.2 CLOUD SERVICES)

    Args:
        log_level (str): The log level to use for the configuration.

    Returns:
        None
    """
    try:
        numeric_level = get_log_level(log_level)
        log_config = LogConfig(numeric_level)
        config_dict = log_config.configure_logging()
        logging.config.dictConfig(config_dict)
        logging.info(f"Logging initialized with level: {log_level}")
    except Exception as e:
        # If there's an error setting up logging, we'll use a basic configuration
        # and log the error to stderr
        logging.basicConfig(level=logging.INFO, format=LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
        logging.error(f"Error setting up logging: {str(e)}")

# Environment-specific configuration
ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')