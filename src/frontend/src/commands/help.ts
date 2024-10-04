import { Colors, RESET } from '../constants/color-scheme';
import { HELP_MESSAGE } from '../constants/cli-messages';
import { OutputFormatter } from '../utils/output-formatter';
import { CLIOptions } from '../interfaces/cli-options.interface';

/**
 * A class that encapsulates help command functionality.
 * This class is responsible for providing users with detailed information about tool usage,
 * available options, and examples.
 */
export class HelpCommand {
  private outputFormatter: OutputFormatter;

  /**
   * Initializes a new instance of the HelpCommand class
   */
  constructor() {
    this.outputFormatter = new OutputFormatter();
  }

  /**
   * Executes the help command, displaying formatted help information.
   * This method addresses the requirement for providing clear, formatted help information via CLI
   * as specified in Technical Specification/2.4 USER INTERFACE DESIGN.
   */
  public execute(): void {
    const formattedHelpMessage = this.formatHelpMessage();
    console.log(formattedHelpMessage);
  }

  /**
   * Formats the help message using the OutputFormatter
   * This method addresses the requirement for displaying comprehensive command-line options and usage
   * as specified in Technical Specification/7.4 COMMAND LINE EXAMPLES.
   * It also fulfills the requirement to offer examples and explanations for tool usage
   * as specified in Technical Specification/2.5 THEME DESIGN.
   * @returns {string} Formatted help message with color coding
   */
  private formatHelpMessage(): string {
    return this.outputFormatter.format(HELP_MESSAGE, {
      headers: Colors.INFO,
      options: Colors.SUCCESS,
      examples: Colors.WARNING,
      reset: RESET
    });
  }
}

/**
 * Function to display the help message
 * This function serves as a convenient wrapper around the HelpCommand class
 * for easy integration with the CLI interface.
 * @param {CLIOptions} options - The command-line options (not used in this function, but included for consistency)
 */
export function displayHelp(options: CLIOptions): void {
  const helpCommand = new HelpCommand();
  helpCommand.execute();
}