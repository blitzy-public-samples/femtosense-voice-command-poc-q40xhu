import { CLIOptions, LanguageType } from '../interfaces/cli-options.interface';
import { validateFilePath, isValidCSVFile, validateOutputDirectory } from '../utils/file-validator';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/cli-messages';

/**
 * Validates all command-line options and ensures they meet the required criteria.
 * @param options - The command-line options to validate
 * @returns A Promise that resolves to true if all validations pass, false otherwise
 */
export async function validateOptions(options: CLIOptions): Promise<boolean> {
  try {
    if (!validateApiKey(options.apikey)) {
      console.error(ERROR_MESSAGES.INVALID_API_KEY);
      return false;
    }

    if (!validateLanguage(options.language)) {
      console.error(ERROR_MESSAGES.INVALID_LANGUAGE);
      return false;
    }

    if (!validateFilePath(options.intent_csv, 'csv') || !isValidCSVFile(options.intent_csv)) {
      console.error(ERROR_MESSAGES.FILE_NOT_FOUND);
      return false;
    }

    if (!validateOutputDirectory(options.outdir)) {
      console.error(ERROR_MESSAGES.INVALID_OUTPUT_DIR);
      return false;
    }

    console.log(SUCCESS_MESSAGES.PROCESS_COMPLETE);
    return true;
  } catch (error) {
    console.error(`Validation error: ${error.message}`);
    return false;
  }
}

/**
 * Validates the provided Narakeet API key format.
 * @param apiKey - The API key to validate
 * @returns True if the API key is valid, false otherwise
 */
function validateApiKey(apiKey: string): boolean {
  // This is a basic check. In a production environment, you might want to make an API call to verify the key.
  const apiKeyRegex = /^[A-Za-z0-9]{40}$/;
  return apiKeyRegex.test(apiKey);
}

/**
 * Ensures the specified language is supported by the system.
 * @param language - The language to validate
 * @returns True if the language is supported, false otherwise
 */
function validateLanguage(language: LanguageType): boolean {
  const supportedLanguages: LanguageType[] = ['korean', 'english', 'japanese'];
  return supportedLanguages.includes(language);
}

/**
 * Custom error class for validation-specific errors.
 */
export class ValidationError extends Error {
  code: string;
  details: string;

  constructor(code: string, message: string, details: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Usage example:
 * 
 * import { CLIOptions } from '../interfaces/cli-options.interface';
 * import { validateOptions } from './validate';
 * 
 * const options: CLIOptions = {
 *     apikey: 'PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy',
 *     language: 'korean',
 *     intent_csv: 'example.csv',
 *     outdir: 'test',
 *     skip_header: 1
 * };
 * 
 * validateOptions(options).then(isValid => {
 *     if (isValid) {
 *         console.log('All options are valid. Proceeding with command generation.');
 *     } else {
 *         console.log('Validation failed. Please check your inputs and try again.');
 *     }
 * });
 */