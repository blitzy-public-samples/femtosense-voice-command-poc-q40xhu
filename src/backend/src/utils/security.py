import os
import hashlib
import secrets
from typing import Optional
from cryptography.fernet import Fernet
from ..config.app_config import AppConfig
from .logger import logger, log_decorator

# Constants for API key header and encryption key environment variable
API_KEY_HEADER: str = 'x-api-key'
ENCRYPTION_KEY_ENV_VAR: str = 'FEMTOSENSE_ENCRYPTION_KEY'

class SecurityException(Exception):
    """Custom exception for security-related errors."""
    pass

@log_decorator("INFO")
def get_encryption_key() -> bytes:
    """
    Retrieves the encryption key from environment variables, ensuring it exists and is valid.

    Returns:
        bytes: The encryption key

    Raises:
        SecurityException: If the encryption key is not set or invalid

    Requirements addressed:
    - Data Security (Technical Specification/6.2 DATA SECURITY)
    - Security Protocols (Technical Specification/6.3 SECURITY PROTOCOLS)
    """
    encryption_key = os.environ.get(ENCRYPTION_KEY_ENV_VAR)
    if not encryption_key:
        logger.error(f"Encryption key not found in environment variable: {ENCRYPTION_KEY_ENV_VAR}")
        raise SecurityException("Encryption key not set in environment variables")
    
    try:
        return encryption_key.encode()
    except Exception as e:
        logger.error(f"Invalid encryption key: {str(e)}")
        raise SecurityException("Invalid encryption key")

@log_decorator("INFO")
def encrypt_sensitive_data(data: str) -> str:
    """
    Encrypts sensitive data using Fernet symmetric encryption.

    Args:
        data (str): The sensitive data to encrypt

    Returns:
        str: Encrypted data string

    Raises:
        SecurityException: If encryption fails

    Requirements addressed:
    - Data Security (Technical Specification/6.2 DATA SECURITY)
    """
    try:
        key = get_encryption_key()
        cipher_suite = Fernet(key)
        encrypted_data = cipher_suite.encrypt(data.encode())
        return encrypted_data.decode()
    except Exception as e:
        logger.error(f"Encryption failed: {str(e)}")
        raise SecurityException("Failed to encrypt sensitive data")

@log_decorator("INFO")
def decrypt_sensitive_data(encrypted_data: str) -> str:
    """
    Decrypts previously encrypted sensitive data.

    Args:
        encrypted_data (str): The encrypted data string

    Returns:
        str: Decrypted data string

    Raises:
        SecurityException: If decryption fails

    Requirements addressed:
    - Data Security (Technical Specification/6.2 DATA SECURITY)
    """
    try:
        key = get_encryption_key()
        cipher_suite = Fernet(key)
        decrypted_data = cipher_suite.decrypt(encrypted_data.encode())
        return decrypted_data.decode()
    except Exception as e:
        logger.error(f"Decryption failed: {str(e)}")
        raise SecurityException("Failed to decrypt sensitive data")

@log_decorator("INFO")
def validate_api_key(api_key: str) -> bool:
    """
    Validates an API key against stored secure hash.

    Args:
        api_key (str): The API key to validate

    Returns:
        bool: True if valid, False otherwise

    Requirements addressed:
    - API Authentication (Technical Specification/6.1 AUTHENTICATION AND AUTHORIZATION)
    """
    stored_hash = AppConfig.get_api_key_hash()
    if not stored_hash:
        logger.error("No API key hash found in configuration")
        return False
    
    hashed_key = hashlib.sha256(api_key.encode()).hexdigest()
    return secrets.compare_digest(hashed_key, stored_hash)

@log_decorator("DEBUG")
def generate_secure_filename(base_name: str) -> str:
    """
    Generates a cryptographically secure filename for storing sensitive files.

    Args:
        base_name (str): The base name for the file

    Returns:
        str: Secure filename

    Requirements addressed:
    - Data Security (Technical Specification/6.2 DATA SECURITY)
    - Security Protocols (Technical Specification/6.3 SECURITY PROTOCOLS)
    """
    random_suffix = secrets.token_hex(8)
    return f"{base_name}_{random_suffix}"

@log_decorator("DEBUG")
def sanitize_input(input_str: str) -> str:
    """
    Sanitizes user input to prevent injection attacks.

    Args:
        input_str (str): The input string to sanitize

    Returns:
        str: Sanitized input string

    Requirements addressed:
    - Security Protocols (Technical Specification/6.3 SECURITY PROTOCOLS)
    """
    # Remove potentially dangerous characters
    sanitized = ''.join(char for char in input_str if char.isalnum() or char in [' ', '-', '_', '.'])
    # Escape special characters
    sanitized = sanitized.replace("'", "''")
    return sanitized

class SecureAPIClient:
    """
    A class that provides secure API communication methods.

    Requirements addressed:
    - API Authentication (Technical Specification/6.1 AUTHENTICATION AND AUTHORIZATION)
    - Data Security (Technical Specification/6.2 DATA SECURITY)
    """

    def __init__(self, api_key: str):
        """
        Initializes the SecureAPIClient with an API key

        Args:
            api_key (str): The API key for authentication

        Raises:
            SecurityException: If the API key is invalid
        """
        if not validate_api_key(api_key):
            logger.error("Invalid API key provided")
            raise SecurityException("Invalid API key")
        self._encrypted_api_key = encrypt_sensitive_data(api_key)

    @log_decorator("INFO")
    def request(self, endpoint: str, method: str, data: Optional[dict] = None) -> dict:
        """
        Makes a secure API request with proper authentication and error handling.

        Args:
            endpoint (str): The API endpoint
            method (str): The HTTP method (GET, POST, etc.)
            data (Optional[Dict]): The request payload

        Returns:
            Dict: API response data

        Raises:
            SecurityException: If the request fails or returns an error

        Requirements addressed:
        - API Authentication (Technical Specification/6.1 AUTHENTICATION AND AUTHORIZATION)
        - Security Protocols (Technical Specification/6.3 SECURITY PROTOCOLS)
        """
        import requests  # Import here to avoid circular dependencies

        try:
            api_key = decrypt_sensitive_data(self._encrypted_api_key)
            headers = {API_KEY_HEADER: api_key}
            
            response = requests.request(method, endpoint, headers=headers, json=data)
            response.raise_for_status()
            
            return response.json()
        except requests.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            raise SecurityException(f"API request failed: {str(e)}")

# Initialize the logger for this module
logger = logger.getChild(__name__)