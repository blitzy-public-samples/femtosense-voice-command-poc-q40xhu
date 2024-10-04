/**
 * Interface defining the structure of command-line options for the Femtosense Voice Command Generation tool.
 * This ensures type safety and consistent option handling across the frontend CLI application.
 */

/**
 * Supported languages for voice command generation.
 * @remarks This type should be kept in sync with the backend supported languages.
 */
export type LanguageType = 'korean' | 'english' | 'japanese';

/**
 * Interface for command-line options in the voice command generation tool.
 */
export interface CLIOptions {
  /**
   * API key for authentication with the Narakeet service.
   * @remarks This should be handled securely and not exposed in logs or error messages.
   */
  apikey: string;

  /**
   * Target language for voice command generation.
   */
  language: LanguageType;

  /**
   * Path to the input CSV file containing intents and phrases.
   */
  intent_csv: string;

  /**
   * Output directory for generated files.
   */
  outdir: string;

  /**
   * Number of header lines to skip in the input CSV file.
   * @default 1
   */
  skip_header?: number;
}

/**
 * Usage example:
 * 
 * import { CLIOptions } from '../interfaces/cli-options.interface';
 * 
 * const options: CLIOptions = {
 *     apikey: 'PJNGN13Xbg17xtqe45CtG6PgfZsdgqE99NErygvy',
 *     language: 'korean',
 *     intent_csv: 'example.csv',
 *     outdir: 'test',
 *     skip_header: 1
 * };
 */