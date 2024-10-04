/**
 * This module handles the formatting and display of CLI output for the Femtosense Voice Command Generation PoC,
 * ensuring consistent and user-friendly presentation of information, progress, and errors.
 * 
 * Requirements addressed:
 * - User-friendly CLI (Technical Specification/2.4 USER INTERFACE DESIGN)
 * - Progress Display (Technical Specification/2.5 THEME DESIGN)
 * - Error Reporting (Technical Specification/7.1 ADDITIONAL TECHNICAL INFORMATION)
 */

import { Colors, RESET, colorize } from '../constants/color-scheme';
import { ProgressState, ProcessingStage, formatProgress } from '../interfaces/progress-state.interface';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, PROGRESS_MESSAGES } from '../constants/cli-messages';

/**
 * Class that encapsulates output formatting functionality.
 */
export class OutputFormatter {
  private readonly spinnerFrames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private spinnerIndex: number = 0;

  /**
   * Main formatting function that delegates to specific formatters based on type.
   * @param type The type of message to format
   * @param content The content to be formatted
   * @returns Formatted output string
   */
  public format(type: 'progress' | 'error' | 'success', content: string | ProgressState): string {
    switch (type) {
      case 'progress':
        return this.formatProgress(content as ProgressState);
      case 'error':
        return this.formatError(content as string);
      case 'success':
        return this.formatSuccess(content as string);
      default:
        return content as string;
    }
  }

  /**
   * Formats the current progress state into a user-friendly string representation with appropriate styling.
   * @param progress The current ProgressState
   * @returns Formatted progress string with color and styling
   */
  private formatProgress(progress: ProgressState): string {
    const formattedProgress = formatProgress(progress);
    const spinner = this.getNextSpinnerFrame();
    return `${spinner} ${formattedProgress}`;
  }

  /**
   * Formats an error message with optional details using appropriate color and styling.
   * @param message The error message to format
   * @param details Optional details about the error
   * @returns Formatted error message with color and styling
   */
  private formatError(message: string, details?: string): string {
    const errorMessage = ERROR_MESSAGES[message] || colorize(message, Colors.ERROR);
    return details ? `${errorMessage}\n${colorize(details, Colors.WARNING)}` : errorMessage;
  }

  /**
   * Formats a success message using appropriate color and styling.
   * @param message The success message to format
   * @returns Formatted success message with color and styling
   */
  private formatSuccess(message: string): string {
    return SUCCESS_MESSAGES[message] || colorize(message, Colors.SUCCESS);
  }

  /**
   * Generates a visual progress bar representation.
   * @param current Current progress value
   * @param total Total progress value
   * @param width Width of the progress bar
   * @returns Visual progress bar string
   */
  public formatProgressBar(current: number, total: number, width: number = 30): string {
    const percentage = Math.floor((current / total) * 100);
    const filledWidth = Math.floor((current / total) * width);
    const emptyWidth = width - filledWidth;
    const bar = `[${'='.repeat(filledWidth)}${' '.repeat(emptyWidth)}]`;
    return `${bar} ${percentage}% (${current}/${total})`;
  }

  /**
   * Returns the next frame of the spinner animation.
   * @returns The next spinner frame character
   */
  private getNextSpinnerFrame(): string {
    const frame = this.spinnerFrames[this.spinnerIndex];
    this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerFrames.length;
    return frame;
  }

  /**
   * Formats a processing stage message.
   * @param stage The current ProcessingStage
   * @returns Formatted processing stage message
   */
  public formatProcessingStage(stage: ProcessingStage): string {
    return colorize(PROGRESS_MESSAGES[stage] || `Processing: ${stage}`, Colors.INFO);
  }

  /**
   * Clears the current line in the console.
   * Useful for updating progress bars or spinners.
   */
  public clearLine(): void {
    process.stdout.write('\r\x1b[K');
  }

  /**
   * Moves the cursor up a specified number of lines in the console.
   * @param lines Number of lines to move up
   */
  public moveCursorUp(lines: number): void {
    process.stdout.write(`\x1b[${lines}A`);
  }

  /**
   * Formats a summary of the voice command generation process.
   * @param totalCommands Total number of commands processed
   * @param totalVariations Total number of variations generated
   * @param totalAudioFiles Total number of audio files created
   * @param elapsedTime Total elapsed time in milliseconds
   * @returns Formatted summary string
   */
  public formatSummary(totalCommands: number, totalVariations: number, totalAudioFiles: number, elapsedTime: number): string {
    const elapsedSeconds = elapsedTime / 1000;
    const summary = [
      colorize('Voice Command Generation Summary:', Colors.INFO),
      `Total Commands Processed: ${totalCommands}`,
      `Total Variations Generated: ${totalVariations}`,
      `Total Audio Files Created: ${totalAudioFiles}`,
      `Total Time Elapsed: ${elapsedSeconds.toFixed(2)} seconds`,
      colorize('Process completed successfully!', Colors.SUCCESS)
    ];
    return summary.join('\n');
  }
}

// Export a singleton instance of the OutputFormatter
export const outputFormatter = new OutputFormatter();