import { Colors } from '../constants/color-scheme';

/**
 * Enum representing the different stages of voice command processing.
 * @description Defines the various stages in the voice command generation pipeline.
 * @requirements_addressed Technical Specification/7.2 GLOSSARY - Batch Processing
 */
export enum ProcessingStage {
    INPUT_PROCESSING = 'Input Processing',
    VARIATION_GENERATION = 'Variation Generation',
    AUDIO_CREATION = 'Audio Creation',
    AWS_UPLOAD = 'AWS Upload'
}

/**
 * Interface defining the structure for error tracking during processing.
 * @description Used to capture and represent errors that occur during the voice command generation process.
 * @requirements_addressed Technical Specification/2.5 THEME DESIGN - User Feedback
 */
export interface ProgressError {
    stage: ProcessingStage;
    message: string;
    item: string;
    timestamp: Date;
}

/**
 * Interface defining the structure for tracking the progress of voice command generation operations.
 * @description Used to represent the current state and progress of the voice command generation process.
 * @requirements_addressed Technical Specification/2.4 USER INTERFACE DESIGN - Progress Display
 */
export interface ProgressState {
    stage: ProcessingStage;
    current: number;
    total: number;
    startTime: Date;
    estimatedEndTime?: Date;
    errors: ProgressError[];
}

/**
 * Function to format the progress state for display in the CLI.
 * @param state The current ProgressState to format
 * @returns A formatted string representation of the progress
 * @requirements_addressed Technical Specification/2.5 THEME DESIGN - Output Formatting
 */
export function formatProgress(state: ProgressState): string {
    const percentage = Math.floor((state.current / state.total) * 100);
    const progressBar = createProgressBar(percentage);
    const stageColor = getStageColor(state.stage);

    return `${stageColor}[${state.stage}] ${progressBar} ${percentage}% | ${state.current}/${state.total}${Colors.RESET}`;
}

/**
 * Helper function to create a visual progress bar.
 * @param percentage The current progress percentage
 * @returns A string representing the progress bar
 */
function createProgressBar(percentage: number): string {
    const barLength = 20;
    const filledLength = Math.floor((percentage / 100) * barLength);
    const emptyLength = barLength - filledLength;

    return `[${'='.repeat(filledLength)}${' '.repeat(emptyLength)}]`;
}

/**
 * Helper function to get the appropriate color for each processing stage.
 * @param stage The current ProcessingStage
 * @returns The color code for the stage
 */
function getStageColor(stage: ProcessingStage): string {
    switch (stage) {
        case ProcessingStage.INPUT_PROCESSING:
            return Colors.INFO;
        case ProcessingStage.VARIATION_GENERATION:
            return Colors.WARNING;
        case ProcessingStage.AUDIO_CREATION:
            return Colors.SUCCESS;
        case ProcessingStage.AWS_UPLOAD:
            return Colors.ERROR;
        default:
            return Colors.RESET;
    }
}