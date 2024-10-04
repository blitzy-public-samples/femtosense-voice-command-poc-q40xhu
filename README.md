# Femtosense Voice Command Generation PoC

## Project Overview

The Femtosense Voice Command Generation Proof of Concept (PoC) system is designed to create linguistically diverse yet semantically consistent variations of voice commands. This system leverages GPT-4o AI technology for intelligent phrase generation and Femtosense's Text-to-Speech (TTS) technology to produce high-quality audio files.

### Key Features

- Automated voice command variation generation
- Support for multiple languages (Korean, English, Japanese)
- High-quality audio dataset creation using Femtosense's TTS technology
- Scalable data management with AWS S3 integration

### System Architecture Overview

The system is composed of several key components:

- Backend: Python-based core processing logic
- API: Node.js service for external integrations
- Frontend: Command-line interface for user interaction
- Database: File-based storage system with AWS S3 integration

## Prerequisites

Before setting up the project, ensure you have the following installed:

- Python 3.7+
- Node.js 14+
- FFmpeg 4.4+
- AWS CLI

You will also need the following API keys:

- GPT-4o API key
- Narakeet API key
- AWS credentials

## Installation

1. Clone the repository:
   ```
   git clone [repository_url]
   cd femtosense-voice-command-poc
   ```

2. Install backend dependencies:
   ```
   cd src/backend
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```
   cd src/frontend
   npm install
   ```

4. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file and add your API keys and AWS credentials.

## Usage

To generate voice commands, use the following command:

```
python src/backend/narakeet_generate_stt.py --apikey YOUR_API_KEY --language korean --intent_csv example.csv --outdir test
```

For more options, run:

```
python src/backend/narakeet_generate_stt.py --help
```

## Project Structure

```
femtosense-voice-command-poc/
├── src/
│   ├── api/
│   ├── backend/
│   ├── database/
│   ├── frontend/
│   └── shared/
├── infrastructure/
├── tests/
└── docs/
```

## Configuration

- Voice registry details can be found in `src/shared/config/voice-profiles.json`
- AWS S3 bucket structure is defined in `src/database/src/config/storage_config.py`
- API configurations are located in `src/api/src/gpt/gpt-config.ts` and `src/api/src/narakeet/narakeet-config.ts`

## Development

### Coding Standards

- Follow PEP 8 for Python code
- Use ESLint with Airbnb style guide for TypeScript/JavaScript

### Testing Guidelines

- Write unit tests for all new features
- Ensure all tests pass before submitting a pull request
- Run tests using `pytest` for backend and `npm test` for frontend

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration. Workflows can be found in the `.github/workflows/` directory.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and troubleshooting:

- Check the [FAQ section](docs/FAQ.md)
- Open an issue on GitHub
- Contact the development team at [support@femtosense.com](mailto:support@femtosense.com)