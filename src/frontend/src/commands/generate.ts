import { CLIOptions, LanguageType } from '../interfaces/cli-options.interface';
import { ProgressTracker } from '../utils/progress-tracker';
import { OutputFormatter } from '../utils/output-formatter';
import { Colors, RESET } from '../constants/color-scheme';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/cli-messages';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Implements the core command for generating voice command variations and audio files
 * in the Femtosense Voice Command Generation PoC frontend CLI application.
 * 
 * @requirements_addressed
 * - Automated Voice Command Generation (Technical Specification/1.1 SYSTEM OBJECTIVES)
 * - High-Quality Audio Dataset Creation (Technical Specification/1.1 SYSTEM OBJECTIVES)
 * - Scalable Data Management (Technical Specification/1.1 SYSTEM OBJECTIVES)
 * - Progress Tracking (Technical Specification/2.4 USER INTERFACE DESIGN)
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Main function that orchestrates the voice command generation process.
 * @param options CLIOptions object containing command-line arguments
 */
export async function generateCommand(options: CLIOptions): Promise<void> {
  const outputFormatter = new OutputFormatter();
  const progressTracker = new ProgressTracker(0); // We'll update the total count later

  try {
    // Process input CSV file
    const inputData = await processInputFile(options.intent_csv, options.skip_header);
    progressTracker.setStage('INPUT_PROCESSING');
    progressTracker.updateProgress(inputData.length);

    // Generate variations for each phrase
    const variations = await generateVariations(inputData, options.language, progressTracker);

    // Generate audio files for variations
    const audioFiles = await generateAudio(variations, options.language, progressTracker);

    // Upload audio files to AWS S3
    await uploadToAWS(audioFiles, options, progressTracker);

    // Display summary
    const summary = outputFormatter.formatSummary(
      inputData.length,
      variations.length,
      audioFiles.size,
      progressTracker.getProgress().estimatedEndTime.getTime() - progressTracker.getProgress().startTime.getTime()
    );
    console.log(summary);

  } catch (error) {
    console.error(outputFormatter.format('error', `${ERROR_MESSAGES.GENERATION_FAILED}: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Processes the input CSV file and returns an array of phrases.
 * @param filePath Path to the input CSV file
 * @param skipHeader Number of header lines to skip
 * @returns Array of phrases
 */
async function processInputFile(filePath: string, skipHeader: number = 1): Promise<string[]> {
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const lines = fileContent.split('\n').slice(skipHeader);
    return lines.map(line => line.split(',')[0].trim()).filter(Boolean);
  } catch (error) {
    throw new Error(`Failed to process input file: ${error.message}`);
  }
}

/**
 * Generates variations of given phrases using GPT-4o API.
 * @param phrases Array of input phrases
 * @param language Target language for variations
 * @param progressTracker ProgressTracker instance
 * @returns Array of generated variations
 */
async function generateVariations(phrases: string[], language: LanguageType, progressTracker: ProgressTracker): Promise<string[]> {
  progressTracker.setStage('VARIATION_GENERATION');
  const variations: string[] = [];

  for (let i = 0; i < phrases.length; i++) {
    try {
      const response = await axios.post(`${API_BASE_URL}/variations`, {
        phrase: phrases[i],
        language,
        count: 50 // Assuming 50 variations per phrase as per requirements
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      variations.push(...response.data.variations);
      progressTracker.updateProgress(i + 1);
    } catch (error) {
      progressTracker.addError(`Failed to generate variations for phrase: ${phrases[i]}`, phrases[i]);
    }
  }

  return variations;
}

/**
 * Generates audio files for each variation using Narakeet TTS API.
 * @param variations Array of variations to generate audio for
 * @param language Target language for audio generation
 * @param progressTracker ProgressTracker instance
 * @returns Map of variation text to audio buffer
 */
async function generateAudio(variations: string[], language: LanguageType, progressTracker: ProgressTracker): Promise<Map<string, Buffer>> {
  progressTracker.setStage('AUDIO_GENERATION');
  const audioFiles = new Map<string, Buffer>();

  for (let i = 0; i < variations.length; i++) {
    try {
      const response = await axios.post(`${API_BASE_URL}/audio`, {
        text: variations[i],
        language
      }, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'arraybuffer'
      });

      audioFiles.set(variations[i], Buffer.from(response.data));
      progressTracker.updateProgress(i + 1);
    } catch (error) {
      progressTracker.addError(`Failed to generate audio for variation: ${variations[i]}`, variations[i]);
    }
  }

  return audioFiles;
}

/**
 * Uploads generated audio files to AWS S3 with proper organization.
 * @param audioFiles Map of variation text to audio buffer
 * @param options CLIOptions object
 * @param progressTracker ProgressTracker instance
 */
async function uploadToAWS(audioFiles: Map<string, Buffer>, options: CLIOptions, progressTracker: ProgressTracker): Promise<void> {
  progressTracker.setStage('AWS_UPLOAD');
  let uploadedCount = 0;

  for (const [variation, audioBuffer] of audioFiles.entries()) {
    try {
      const fileName = `${options.language}/${encodeURIComponent(variation)}.wav`;
      const filePath = path.join(options.outdir, fileName);

      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

      // Write file locally
      await fs.promises.writeFile(filePath, audioBuffer);

      // TODO: Implement actual AWS S3 upload here
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate upload time

      uploadedCount++;
      progressTracker.updateProgress(uploadedCount);
    } catch (error) {
      progressTracker.addError(`Failed to upload audio file for variation: ${variation}`, variation);
    }
  }
}

/**
 * Example usage:
 * 
 * import { generateCommand } from './commands/generate';
 * import { CLIOptions } from './interfaces/cli-options.interface';
 * 
 * const options: CLIOptions = {
 *   apikey: 'your-api-key',
 *   language: 'korean',
 *   intent_csv: 'path/to/input.csv',
 *   outdir: 'path/to/output',
 *   skip_header: 1
 * };
 * 
 * generateCommand(options).catch(console.error);
 */