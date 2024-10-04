# Femtosense Voice Command Generation Tool - Frontend

This directory contains the frontend documentation and command-line interface for the Femtosense Voice Command Generation tool. This README provides comprehensive information about the setup, usage, and development of the frontend component.

## Installation

To set up the frontend component, follow these steps:

```bash
git clone [repository_url]
cd src/frontend
npm install
```

## Configuration

Before using the tool, you need to set up the necessary environment variables:

1. Create a `.env` file in the `src/frontend` directory based on the `.env.example` template.
2. Set the required environment variables:

```
NARAKEET_API_KEY=your_api_key_here
AWS_ACCESS_KEY_ID=your_aws_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## Usage

The command-line interface can be used with the following structure:

```
node cli.js [options]
```

### Options

- `--apikey TEXT`: Narakeet API key (required)
- `--language TEXT`: Target language (korean, english, japanese) (required)
- `--intent_csv PATH`: Path to input CSV file (required)
- `--outdir PATH`: Output directory for generated files (required)
- `--skip_header INT`: Number of header lines to skip (default: 1)
- `--help`: Show help message and exit

### Examples

1. Standard execution:
```bash
node cli.js --apikey PJNGN13X... --language korean --intent_csv example.csv --outdir test
```

2. Processing Japanese commands:
```bash
node cli.js --apikey PJNGN13X... --language japanese --intent_csv commands.csv --outdir jp_test --skip_header 2
```

3. Generating wake word variations:
```bash
node cli.js --apikey PJNGN13X... --language english --intent_csv wakeword.csv --outdir wake_test
```

## Troubleshooting

Common issues and their solutions:

1. API key errors: Ensure that the Narakeet API key is correctly set in the `.env` file or provided as a command-line argument.
2. File format issues: Verify that the input CSV file is correctly formatted and contains the required columns.
3. Network connectivity problems: Check your internet connection and firewall settings.
4. AWS configuration issues: Make sure the AWS credentials are correctly set in the `.env` file.

## Development

### Project Structure

- `src/`: Contains the source code for the CLI tool
  - `interfaces/`: TypeScript interfaces for CLI options and progress state
  - `constants/`: Constant values for CLI messages and color schemes
  - `utils/`: Utility functions for input processing, progress tracking, etc.
  - `commands/`: Implementation of CLI commands (generate, validate, help)
  - `cli.ts`: Main entry point for the CLI application
- `tests/`: Contains unit tests for the frontend components
- `package.json`: Node.js project configuration
- `tsconfig.json`: TypeScript compiler configuration
- `jest.config.js`: Jest testing framework configuration

### Building from Source

To build the project from source:

```bash
npm run build
```

### Running Tests

To run the test suite:

```bash
npm test
```

### Contributing

Please refer to the main project's CONTRIBUTING.md file for guidelines on how to contribute to this project.

## License

This project is licensed under [LICENSE_TYPE]. See the LICENSE file in the root directory for more details.