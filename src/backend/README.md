# Femtosense Voice Command Generation Proof of Concept - Backend

## Introduction

This README provides comprehensive documentation for the backend component of the Femtosense Voice Command Generation Proof of Concept (PoC) system. The backend is responsible for automated voice command variation generation, high-quality audio dataset creation, and scalable data management.

## Prerequisites

Before setting up the backend, ensure you have the following installed:

- Python 3.7+
- FFmpeg
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
   ```
   git clone [repository_url]
   cd src/backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Configuration

1. Copy the `.env.example` file to `.env` and fill in the required environment variables:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file with your specific configuration:
   ```
   NARAKEET_API_KEY=your_api_key_here
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   ```

## Usage

To run the voice command generation process:

```
python narakeet_generate_stt.py --apikey PJNGN13X... --language korean --intent_csv example.csv --outdir test
```

Options:
- `--apikey`: Narakeet API key (required)
- `--language`: Target language (korean, english, japanese) (required)
- `--intent_csv`: Path to input CSV file (required)
- `--outdir`: Output directory for generated files (required)
- `--skip_header`: Number of header lines to skip (default: 1)

## Docker Deployment

To run the application in a Docker container:

1. Build the Docker image:
   ```
   docker build -t femtosense/voice-command-backend .
   ```

2. Run the container:
   ```
   docker run -v $(pwd)/data:/app/data -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} femtosense/voice-command-backend --apikey PJNGN13X... --language korean --intent_csv example.csv --outdir test
   ```

## Project Structure

```
src/backend/
├── src/
│   ├── cli/
│   │   ├── command_line_parser.py
│   │   └── progress_display.py
│   ├── config/
│   │   ├── app_config.py
│   │   └── logging_config.py
│   ├── core/
│   │   ├── batch_processor.py
│   │   ├── file_manager.py
│   │   └── input_processor.py
│   ├── services/
│   │   └── aws_service.py
│   └── utils/
│       ├── audio_converter.py
│       ├── error_handler.py
│       ├── logger.py
│       └── security.py
├── tests/
│   ├── test_audio_converter.py
│   ├── test_aws_service.py
│   ├── test_batch_processor.py
│   ├── test_command_line_parser.py
│   ├── test_file_manager.py
│   └── test_input_processor.py
├── .dockerignore
├── .env.example
├── Dockerfile
├── narakeet_generate_stt.py
├── README.md
├── requirements.txt
└── setup.py
```

## Development Guidelines

1. Follow PEP 8 style guide for Python code.
2. Write unit tests for all new functionality.
3. Use type hints and docstrings for all functions and classes.
4. Handle exceptions appropriately and log errors.
5. Use the `logger` module for all logging operations.

## Testing

To run the test suite:

```
python -m pytest
```

For coverage report:

```
python -m pytest --cov=src tests/
```

## Error Handling

The application uses custom error classes defined in `src/utils/error_handler.py`. Common error scenarios include:

- `ApiRequestError`: Issues with external API calls (GPT-4o, Narakeet)
- `ValidationError`: Input data validation failures
- `FileSystemError`: File system operation failures

Errors are logged and handled gracefully, with appropriate error messages displayed to the user.

## Troubleshooting

1. **API Key Issues**: Ensure your Narakeet API key is correctly set in the `.env` file or provided as a command-line argument.
2. **AWS Credentials**: Verify that your AWS credentials are correctly configured in the `.env` file or your AWS CLI configuration.
3. **FFmpeg Missing**: Make sure FFmpeg is installed and accessible in your system PATH.

## Contributing

Please refer to the `CONTRIBUTING.md` file in the root of the repository for guidelines on how to contribute to this project.

## Performance Considerations

- The system processes commands in batches to optimize API usage and improve overall performance.
- Audio file conversion is done using FFmpeg, which is highly optimized for audio processing.
- AWS S3 multipart uploads are used for large files to improve upload speeds and reliability.

## Security Guidelines

- API keys and AWS credentials should never be committed to the repository.
- Use environment variables or secure secret management systems for storing sensitive information.
- Implement proper input validation to prevent injection attacks.
- Regularly update dependencies to patch known vulnerabilities.

## Logging

- Application logs are stored in the `logs/` directory.
- Log rotation is implemented to manage log file sizes.
- Different log levels (DEBUG, INFO, WARNING, ERROR) are used appropriately throughout the application.

## Future Considerations

1. Implement a web interface for easier interaction with the system.
2. Add support for real-time audio generation and streaming.
3. Integrate with a distributed task queue (e.g., Celery) for improved scalability.
4. Implement more advanced error recovery and retry mechanisms.
5. Add support for custom voice creation and management.

For any questions or issues, please open an issue in the GitHub repository or contact the Femtosense development team.