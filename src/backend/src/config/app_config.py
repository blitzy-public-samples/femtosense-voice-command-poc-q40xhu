import os
from typing import Dict, List, Any

# Internal imports
from .logging_config import configure_logging

# Constants
DEFAULT_LANGUAGE = 'english'
SUPPORTED_LANGUAGES = ['korean', 'english', 'japanese']
MAX_VARIATIONS = 50
AUDIO_FORMAT = 'wav'

# API Configuration
API_CONFIG = {
    'gpt': {
        'base_url': 'https://api.openai.com/v1',
        'timeout': 30,
        'max_retries': 3
    },
    'narakeet': {
        'base_url': 'https://api.narakeet.com',
        'timeout': 60,
        'max_retries': 3
    }
}

# AWS Configuration
AWS_CONFIG = {
    's3': {
        'bucket_name': 'femtosense-voice-commands',
        'region': 'us-west-2',
        'folder_structure': {
            'language': '{language}',
            'intent': '{intent}',
            'variation': '{phrase_variation}'
        }
    },
    'cloudwatch': {
        'log_retention_days': 30,
        'metrics_namespace': 'FemtosenseVoiceCommands'
    }
}

# Voice Registry
VOICE_REGISTRY: Dict[str, List[str]] = {
    'korean': ['Chae-Won', 'Min-Ho', 'Seo-Yeon', 'Tae-Hee', 'Joon-Gi'],
    'english': ['Matt', 'Linda', 'Betty'],
    'japanese': ['Yuriko', 'Akira', 'Kasumi']
}

class AppConfig:
    """
    Configuration class for the Femtosense Voice Command Generation application.
    Handles loading and providing access to all configuration settings.
    """

    def __init__(self):
        self.api_keys: Dict[str, str] = {}
        self.aws_config: Dict[str, Any] = AWS_CONFIG
        self.voice_registry: Dict[str, List[str]] = VOICE_REGISTRY

    def load_config(self) -> None:
        """
        Loads all configuration settings from environment variables and files.
        
        This method addresses the 'Centralized Configuration' requirement
        from Technical Specification/3.3 COMPONENT DIAGRAMS.
        """
        self._load_api_keys()
        self._load_aws_config()
        configure_logging()  # Assuming this function exists in logging_config.py

    def _load_api_keys(self) -> None:
        """
        Loads API keys from environment variables.
        """
        self.api_keys['gpt'] = os.environ.get('GPT_API_KEY', '')
        self.api_keys['narakeet'] = os.environ.get('NARAKEET_API_KEY', '')

        if not all(self.api_keys.values()):
            raise ValueError("Missing API keys. Please set GPT_API_KEY and NARAKEET_API_KEY environment variables.")

    def _load_aws_config(self) -> None:
        """
        Loads AWS configuration from environment variables.
        
        This method addresses the 'AWS Configuration' requirement
        from Technical Specification/5.2 CLOUD SERVICES.
        """
        aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')

        if not aws_access_key or not aws_secret_key:
            raise ValueError("Missing AWS credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.")

        self.aws_config['credentials'] = {
            'access_key_id': aws_access_key,
            'secret_access_key': aws_secret_key
        }

    def get_api_key(self, service: str) -> str:
        """
        Retrieves the API key for a specified service.

        Args:
            service (str): The name of the service ('gpt' or 'narakeet').

        Returns:
            str: The API key for the specified service.

        Raises:
            ValueError: If the specified service is not recognized.
        """
        if service not in self.api_keys:
            raise ValueError(f"Unknown service: {service}. Valid options are 'gpt' and 'narakeet'.")
        return self.api_keys[service]

# Global instance of AppConfig
APP_CONFIG = AppConfig()

def initialize_app_config():
    """
    Initializes the global APP_CONFIG instance.
    This function should be called at the start of the application.
    """
    APP_CONFIG.load_config()

# Ensure all required environment variables are set
required_env_vars = [
    'GPT_API_KEY', 'NARAKEET_API_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'
]

missing_vars = [var for var in required_env_vars if var not in os.environ]
if missing_vars:
    raise EnvironmentError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Initialize logging
configure_logging()  # Assuming this function exists in logging_config.py

# Load configuration
initialize_app_config()