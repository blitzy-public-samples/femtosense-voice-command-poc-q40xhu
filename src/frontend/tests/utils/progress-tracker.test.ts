import { ProgressTracker } from '../../src/utils/progress-tracker';
import { ProcessingStage, ProgressState } from '../../src/interfaces/progress-state.interface';
import { Colors, RESET } from '../../src/constants/color-scheme';

// Mock console methods
console.log = jest.fn();
console.error = jest.fn();

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  const totalItems = 100;

  beforeEach(() => {
    // Mock the Date object to have consistent timestamps
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00Z'));
    progressTracker = new ProgressTracker(totalItems);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should initialize with correct values', () => {
    const progress = progressTracker.getProgress();
    expect(progress).toEqual({
      stage: ProcessingStage.INPUT_PROCESSING,
      current: 0,
      total: totalItems,
      startTime: new Date('2023-01-01T00:00:00Z'),
      errors: [],
    });
  });

  test('should update progress correctly', () => {
    progressTracker.updateProgress(50);
    const progress = progressTracker.getProgress();
    expect(progress.current).toBe(50);
    expect(progress.estimatedEndTime).toBeDefined();
    expect(console.log).toHaveBeenCalled();
  });

  test('should set stage correctly', () => {
    progressTracker.setStage(ProcessingStage.VARIATION_GENERATION);
    const progress = progressTracker.getProgress();
    expect(progress.stage).toBe(ProcessingStage.VARIATION_GENERATION);
    expect(console.log).toHaveBeenCalledWith(`\n${Colors.INFO}Starting VARIATION_GENERATION...${RESET}`);
  });

  test('should add error correctly', () => {
    const errorMessage = 'Test error';
    const errorItem = 'Item 1';
    progressTracker.addError(errorMessage, errorItem);
    const progress = progressTracker.getProgress();
    expect(progress.errors).toHaveLength(1);
    expect(progress.errors[0]).toEqual({
      stage: ProcessingStage.INPUT_PROCESSING,
      message: errorMessage,
      item: errorItem,
      timestamp: expect.any(Date),
    });
    expect(console.error).toHaveBeenCalledWith(
      `${Colors.ERROR}Error in INPUT_PROCESSING: ${errorMessage} (Item: ${errorItem})${RESET}`
    );
  });

  test('should calculate estimated end time', () => {
    jest.advanceTimersByTime(30000); // Advance time by 30 seconds
    progressTracker.updateProgress(50);
    const progress = progressTracker.getProgress();
    expect(progress.estimatedEndTime).toEqual(new Date('2023-01-01T00:01:00Z'));
  });

  test('should display summary correctly', () => {
    progressTracker.updateProgress(75);
    progressTracker.addError('Test error', 'Item 50');
    progressTracker.displaySummary();

    expect(console.log).toHaveBeenCalledWith(`\n${Colors.INFO}Progress Summary:${RESET}`);
    expect(console.log).toHaveBeenCalledWith('Total items processed: 75/100');
    expect(console.log).toHaveBeenCalledWith('Time taken: 0h 0m 0s');
    expect(console.log).toHaveBeenCalledWith(`\n${Colors.ERROR}Errors encountered:${RESET}`);
    expect(console.log).toHaveBeenCalledWith('1. INPUT_PROCESSING: Test error (Item: Item 50)');
  });

  test('should display summary with no errors', () => {
    progressTracker.updateProgress(100);
    progressTracker.displaySummary();

    expect(console.log).toHaveBeenCalledWith(`\n${Colors.SUCCESS}No errors encountered during processing.${RESET}`);
  });

  test('should handle multiple errors', () => {
    progressTracker.addError('Error 1', 'Item 1');
    progressTracker.addError('Error 2', 'Item 2');
    const progress = progressTracker.getProgress();
    expect(progress.errors).toHaveLength(2);
  });

  test('should format time difference correctly', () => {
    jest.advanceTimersByTime(3661000); // Advance time by 1 hour, 1 minute, and 1 second
    progressTracker.updateProgress(100);
    progressTracker.displaySummary();
    expect(console.log).toHaveBeenCalledWith('Time taken: 1h 1m 1s');
  });
});