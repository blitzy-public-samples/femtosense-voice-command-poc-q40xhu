import { Colors } from './color-scheme';

// Help message displayed when the user requests CLI usage information
export const HELP_MESSAGE = `
Usage: narakeet_generate_stt [OPTIONS]

Options:
  --apikey TEXT       Narakeet API key [required]
  --language TEXT     Target language (korean, english, japanese) [required]
  --intent_csv PATH   Path to input CSV file [required]
  --outdir PATH       Output directory for generated files [required]
  --skip_header INT   Number of header lines to skip [default: 1]
  --help              Show this message and exit

Example:
  narakeet_generate_stt \\
    --apikey PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy \\
    --language korean \\
    --intent_csv example.csv \\
    --outdir test
`;

// Collection of error messages for different scenarios
export const ERROR_MESSAGES = {
  INVALID_API_KEY: `${Colors.ERROR}✗ Error: Invalid API key. Please check your credentials.${Colors.RESET}`,
  FILE_NOT_FOUND: `${Colors.ERROR}✗ Error: Input file not found. Please verify the path.${Colors.RESET}`,
  INVALID_LANGUAGE: `${Colors.ERROR}✗ Error: Invalid language specified. Supported languages: korean, english, japanese${Colors.RESET}`,
  NETWORK_ERROR: `${Colors.ERROR}✗ Error: Network error occurred. Please check your connection.${Colors.RESET}`,
  AWS_UPLOAD_FAILED: `${Colors.ERROR}✗ Error: Failed to upload files to AWS S3.${Colors.RESET}`,
  INVALID_OUTPUT_DIR: `${Colors.ERROR}✗ Error: Invalid output directory specified.${Colors.RESET}`,
};

// Collection of success messages for different operations
export const SUCCESS_MESSAGES = {
  VARIATIONS_GENERATED: `${Colors.SUCCESS}✓ Successfully generated command variations.${Colors.RESET}`,
  AUDIO_CREATED: `${Colors.SUCCESS}✓ Successfully created audio files.${Colors.RESET}`,
  UPLOAD_COMPLETE: `${Colors.SUCCESS}✓ Successfully uploaded files to AWS S3.${Colors.RESET}`,
  PROCESS_COMPLETE: `${Colors.SUCCESS}✓ Voice command generation process completed successfully.${Colors.RESET}`,
};

// Messages used for showing progress during operations
export const PROGRESS_MESSAGES = {
  GENERATING_VARIATIONS: `${Colors.INFO}Generating command variations...${Colors.RESET}`,
  CREATING_AUDIO: `${Colors.INFO}Creating audio files...${Colors.RESET}`,
  UPLOADING_FILES: `${Colors.INFO}Uploading files to AWS S3...${Colors.RESET}`,
};