# Femtosense Voice Command Generation API

This README provides comprehensive information about the API component of the Femtosense Voice Command Generation system, including setup instructions, usage guidelines, and development practices.

[![Build Status](https://img.shields.io/travis/femtosense/voice-command-api/main.svg)](https://travis-ci.org/femtosense/voice-command-api)
[![Test Coverage](https://img.shields.io/codecov/c/github/femtosense/voice-command-api/main.svg)](https://codecov.io/gh/femtosense/voice-command-api)
[![Dependencies](https://img.shields.io/david/femtosense/voice-command-api.svg)](https://david-dm.org/femtosense/voice-command-api)

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Docker](#docker)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Introduction

The API component of the Femtosense Voice Command Generation system is responsible for handling variation generation and audio generation requests. It integrates with GPT-4o for creating linguistically diverse command variations and Narakeet for high-quality Text-to-Speech (TTS) audio generation.

Key features:
- Automated voice command variation generation
- High-quality audio dataset creation
- Multi-language support (Korean, English, Japanese)
- Scalable AWS S3 integration for data storage

## Prerequisites

Before setting up the API, ensure you have the following installed:

- Node.js (v14.x or later)
- npm (v6.x or later)
- FFmpeg (v4.4 or later)
- AWS CLI (configured with appropriate credentials)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/femtosense/voice-command-api.git
   cd voice-command-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the example environment file and update it with your settings:
   ```
   cp .env.example .env
   ```

## Configuration

The API uses environment variables for configuration. Edit the `.env` file with your specific settings:

```
# API Configuration
PORT=3000
NODE_ENV=development

# GPT-4o API
GPT_API_KEY=your_gpt_api_key_here
GPT_API_URL=https://api.openai.com/v1

# Narakeet TTS API
NARAKEET_API_KEY=your_narakeet_api_key_here
NARAKEET_API_URL=https://api.narakeet.com

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-west-2
S3_BUCKET_NAME=femtosense-voice-commands

# Voice Registry Settings
VOICE_REGISTRY_PATH=./src/config/voice-profiles.json
```

## Usage

To start the API server:

1. For development:
   ```
   npm run dev
   ```

2. For production:
   ```
   npm run build
   npm start
   ```

The API will be available at `http://localhost:3000` (or the port specified in your `.env` file).

## API Documentation

### Endpoints

#### 1. Generate Variations

- **URL**: `/api/variations`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "phrase": "불 켜줘",
    "language": "korean",
    "count": 50
  }
  ```
- **Response**:
  ```json
  {
    "variations": [
      "조명 켜주세요",
      "불 좀 켜주시겠어요?",
      "불을 켜주세요",
      ...
    ]
  }
  ```

#### 2. Generate Audio

- **URL**: `/api/audio`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "text": "불 켜줘",
    "language": "korean",
    "voice": "Chae-Won"
  }
  ```
- **Response**: Audio file (WAV format)

For detailed API documentation, refer to the [API Specification](./docs/api-spec.md).

## Development

### Code Style

We use ESLint and Prettier for code formatting and style checking. Run the following commands before committing:

```
npm run lint
npm run format
```

### Pull Request Process

1. Create a new branch for your feature or bug fix.
2. Make your changes and commit them with clear, descriptive messages.
3. Push your branch and create a pull request against the `main` branch.
4. Ensure all CI checks pass.
5. Request a review from a team member.

## Docker

To run the API using Docker:

1. Build the Docker image:
   ```
   docker build -t femtosense-api .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 --env-file .env femtosense-api
   ```

## Testing

Run the test suite:

```
npm test
```

For test coverage:

```
npm run test:coverage
```

Ensure that test coverage remains above 80% for all new code.

## Troubleshooting

Common issues and their solutions:

1. **API Key Issues**: Ensure that your GPT-4o and Narakeet API keys are correctly set in the `.env` file.

2. **AWS Credentials**: Verify that your AWS credentials are properly configured either in the `.env` file or through the AWS CLI.

3. **FFmpeg Not Found**: Make sure FFmpeg is installed and accessible in your system's PATH.

4. **Port Already in Use**: If the default port (3000) is already in use, specify a different port in the `.env` file.

For additional support, please [open an issue](https://github.com/femtosense/voice-command-api/issues) on our GitHub repository.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Contributors

- John Doe (john.doe@femtosense.com)
- Jane Smith (jane.smith@femtosense.com)

For questions or support, contact api-support@femtosense.com.