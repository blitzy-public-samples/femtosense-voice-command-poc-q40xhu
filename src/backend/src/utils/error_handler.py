import traceback
from typing import Dict, Any
from ..config.logging_config import LoggingConfig

# Import the logger module. Since it's not available, we'll assume its interface.
from .logger import logger

class BaseError(Exception):
    """
    Base custom error class that extends the native Exception class,
    providing consistent error creation and handling.
    
    Requirements addressed:
    - Error Standardization (Technical Specification/6. SECURITY CONSIDERATIONS/6.1 AUTHENTICATION AND AUTHORIZATION)
    """
    def __init__(self, message: str, error_code: int):
        super().__init__(message)
        self.message = message
        self.error_code = error_code

class ApiRequestError(BaseError):
    """
    Custom error class for API-related errors.
    
    Requirements addressed:
    - API Error Handling (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
    """
    def __init__(self, message: str, status_code: int, details: Dict[str, Any] = None):
        super().__init__(message, status_code)
        self.details = details or {}

class ValidationError(BaseError):
    """
    Custom error class for validation-related errors.
    """
    def __init__(self, message: str):
        super().__init__(message, 400)

class FileSystemError(BaseError):
    """
    Custom error class for file system-related errors.
    """
    def __init__(self, message: str):
        super().__init__(message, 500)

def handle_error(error: Exception, log_level: str = 'error') -> Dict[str, Any]:
    """
    Processes and logs an error, returning a standardized error response format.
    
    Requirements addressed:
    - Error Standardization (Technical Specification/6. SECURITY CONSIDERATIONS/6.1 AUTHENTICATION AND AUTHORIZATION)
    - Operational Security (Technical Specification/6. SECURITY CONSIDERATIONS/6.3.1 Operational Security)
    - API Error Handling (Technical Specification/3.2 API DESIGN/3.2.1 External API Interfaces)
    
    Args:
        error (Exception): The error to be handled.
        log_level (str): The log level to use when logging the error.
    
    Returns:
        Dict[str, Any]: Standardized error response dictionary.
    """
    formatted_error = format_exception(error)
    
    # Log the error using the specified log level
    log_func = getattr(logger, log_level)
    log_func(f"Error occurred: {formatted_error['message']}", extra=formatted_error)
    
    return formatted_error

def format_exception(error: Exception) -> Dict[str, Any]:
    """
    Formats an exception into a standardized dictionary format.
    
    Args:
        error (Exception): The error to be formatted.
    
    Returns:
        Dict[str, Any]: Formatted error dictionary.
    """
    if isinstance(error, BaseError):
        error_code = error.error_code
        message = error.message
    else:
        error_code = 500
        message = str(error)
    
    error_dict = {
        'error_code': error_code,
        'message': message,
        'type': error.__class__.__name__,
    }
    
    if isinstance(error, ApiRequestError):
        error_dict['details'] = error.details
    
    # Include stack trace in development environment
    if LoggingConfig.ENVIRONMENT == 'development':
        error_dict['stack_trace'] = traceback.format_exc()
    
    return error_dict

# Additional utility functions can be added here as needed