import { Command } from 'commander';
import { CLIOptions, LanguageType } from './interfaces/cli-options.interface';
import { displayHelp } from './commands/help';
import { generateCommand } from './commands/generate';
import { processInputs } from './utils/input-processor';
import { ProgressTracker } from './utils/progress-tracker';
import { Colors, RESET } from './constants/color-scheme';

/**
 * The main command-line interface entry point for the Femtosense Voice Command Generation tool.
 * This file orchestrates the entire process of generating voice command variations and audio files.
 * 
 * @requirements_addressed
 * - Command Line Interface (Technical Specification/2.4 USER INTERFACE DESIGN)
 * - Input Processing (Technical Specification/1.2.1 Core Functionalities)
 * - Error Handling (Technical Specification/2.5 THEME DESIGN)
 * - Process Orchestration (Technical Specification/3.4.1 Voice Command Generation Sequence)
 */

const program = new Command();

/**
 * The main entry point function that orchestrates the CLI tool's execution.
 */
async function main(): Promise<void> {
  try {
    program
      .name('narakeet_generate_stt')
      .description('Femtosense Voice Command Generation tool')
      .version('1.0.0')
      .requiredOption('--apikey <key>', 'Narakeet API key')
      .requiredOption('--language <lang>', 'Target language (korean, english, japanese)')
      .requiredOption('--intent_csv <path>', 'Path to input CSV file')
      .requiredOption('--outdir <path>', 'Output directory for generated files')
      .option('--skip_header <number>', 'Number of header lines to skip', '1')
      .helpOption('-h, --help', 'Display help information')
      .action(async (options: CLIOptions) => {
        // Process and validate inputs
        const validatedOptions = processInputs(options);

        if (options.help) {
          displayHelp(validatedOptions);
        } else {
          await generateCommand(validatedOptions);
        }
      });

    await program.parseAsync(process.argv);
  } catch (error) {
    handleError(error);
  }
}

/**
 * Handles and formats error output for the user.
 * @param error The error object to handle
 */
function handleError(error: Error): void {
  console.error(`${Colors.ERROR}Error: ${error.message}${RESET}`);
  console.error('For usage information, run: narakeet_generate_stt --help');
  process.exit(1);
}

// Entry point
if (require.main === module) {
  main();
}

export { main };