import { ProgressState, ProcessingStage, ProgressError, formatProgress } from '../interfaces/progress-state.interface';
import { Colors, RESET } from '../constants/color-scheme';

/**
 * A class that manages and displays progress information for the voice command generation process.
 * @description Implements progress tracking functionality for the frontend CLI application.
 * @requirements_addressed 
 * - Progress Display (Technical Specification/2.4 USER INTERFACE DESIGN)
 * - Batch Processing (Technical Specification/7.1.1 Voice Registry Details)
 * - Error Handling (Technical Specification/7.5 FILE STRUCTURE EXAMPLES)
 */
export class ProgressTracker {
    private currentState: ProgressState;
    private startTime: Date;

    /**
     * Initializes a new progress tracker with the total number of items to process.
     * @param totalItems The total number of items to be processed
     */
    constructor(totalItems: number) {
        this.startTime = new Date();
        this.currentState = {
            stage: ProcessingStage.INPUT_PROCESSING,
            current: 0,
            total: totalItems,
            startTime: this.startTime,
            errors: []
        };
    }

    /**
     * Updates the current progress and recalculates estimated end time.
     * @param current The current number of processed items
     */
    updateProgress(current: number): void {
        this.currentState.current = current;
        this.currentState.estimatedEndTime = this.calculateEstimatedEndTime();
        console.log(formatProgress(this.currentState));
    }

    /**
     * Sets the current processing stage and updates the display.
     * @param stage The new processing stage
     */
    setStage(stage: ProcessingStage): void {
        this.currentState.stage = stage;
        console.log(`\n${Colors.INFO}Starting ${stage}...${RESET}`);
    }

    /**
     * Adds an error to the progress tracking.
     * @param message The error message
     * @param item The item that caused the error
     */
    addError(message: string, item: string): void {
        const error: ProgressError = {
            stage: this.currentState.stage,
            message,
            item,
            timestamp: new Date()
        };
        this.currentState.errors.push(error);
        console.error(`${Colors.ERROR}Error in ${this.currentState.stage}: ${message} (Item: ${item})${RESET}`);
    }

    /**
     * Returns the current progress state.
     * @returns The current ProgressState object
     */
    getProgress(): ProgressState {
        return { ...this.currentState };
    }

    /**
     * Calculates the estimated completion time based on current progress.
     * @returns The estimated completion Date
     */
    private calculateEstimatedEndTime(): Date {
        const elapsedTime = new Date().getTime() - this.startTime.getTime();
        const estimatedTotalTime = (elapsedTime / this.currentState.current) * this.currentState.total;
        return new Date(this.startTime.getTime() + estimatedTotalTime);
    }

    /**
     * Formats the progress bar string for display.
     * @returns A formatted string representing the progress bar
     */
    private formatProgressBar(): string {
        const percentage = Math.floor((this.currentState.current / this.currentState.total) * 100);
        const filledLength = Math.floor(percentage / 2);
        const emptyLength = 50 - filledLength;
        return `[${'='.repeat(filledLength)}${' '.repeat(emptyLength)}] ${percentage}%`;
    }

    /**
     * Displays a summary of the progress, including any errors encountered.
     */
    displaySummary(): void {
        console.log(`\n${Colors.INFO}Progress Summary:${RESET}`);
        console.log(`Total items processed: ${this.currentState.current}/${this.currentState.total}`);
        console.log(`Time taken: ${this.formatTimeDifference(new Date(), this.startTime)}`);
        
        if (this.currentState.errors.length > 0) {
            console.log(`\n${Colors.ERROR}Errors encountered:${RESET}`);
            this.currentState.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.stage}: ${error.message} (Item: ${error.item})`);
            });
        } else {
            console.log(`\n${Colors.SUCCESS}No errors encountered during processing.${RESET}`);
        }
    }

    /**
     * Formats the time difference between two dates.
     * @param endDate The end date
     * @param startDate The start date
     * @returns A formatted string representing the time difference
     */
    private formatTimeDifference(endDate: Date, startDate: Date): string {
        const diff = endDate.getTime() - startDate.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    }
}

/**
 * Example usage:
 * 
 * const tracker = new ProgressTracker(100);
 * tracker.setStage(ProcessingStage.VARIATION_GENERATION);
 * for (let i = 0; i < 100; i++) {
 *     tracker.updateProgress(i + 1);
 *     if (i === 50) {
 *         tracker.addError('Failed to generate variation', 'Phrase 51');
 *     }
 * }
 * tracker.displaySummary();
 */