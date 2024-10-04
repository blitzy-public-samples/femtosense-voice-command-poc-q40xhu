import { OutputFormatter } from '../../src/utils/output-formatter';
import { Colors, RESET } from '../../src/constants/color-scheme';
import { ProgressState, ProcessingStage } from '../../src/interfaces/progress-state.interface';

describe('OutputFormatter', () => {
  let formatter: OutputFormatter;

  beforeEach(() => {
    formatter = new OutputFormatter();
  });

  describe('format', () => {
    it('should format progress correctly', () => {
      const progressState: ProgressState = {
        stage: ProcessingStage.VARIATION_GENERATION,
        current: 25,
        total: 100,
        startTime: new Date(),
        errors: []
      };
      const result = formatter.format('progress', progressState);
      expect(result).toContain('[Variation Generation]');
      expect(result).toContain('25%');
      expect(result).toContain('25/100');
    });

    it('should format error correctly', () => {
      const errorMessage = 'Test error message';
      const result = formatter.format('error', errorMessage);
      expect(result).toContain(Colors.ERROR);
      expect(result).toContain(errorMessage);
      expect(result).toContain(RESET);
    });

    it('should format success correctly', () => {
      const successMessage = 'Test success message';
      const result = formatter.format('success', successMessage);
      expect(result).toContain(Colors.SUCCESS);
      expect(result).toContain(successMessage);
      expect(result).toContain(RESET);
    });
  });

  describe('formatProgressBar', () => {
    it('should generate correct progress bar representation', () => {
      const result = formatter.formatProgressBar(30, 100, 20);
      expect(result).toBe('[======              ] 30% (30/100)');
    });

    it('should handle 0% progress', () => {
      const result = formatter.formatProgressBar(0, 100, 20);
      expect(result).toBe('[                    ] 0% (0/100)');
    });

    it('should handle 100% progress', () => {
      const result = formatter.formatProgressBar(100, 100, 20);
      expect(result).toBe('[====================] 100% (100/100)');
    });
  });

  describe('formatProcessingStage', () => {
    it('should format processing stage correctly', () => {
      const result = formatter.formatProcessingStage(ProcessingStage.AUDIO_CREATION);
      expect(result).toContain(Colors.INFO);
      expect(result).toContain('Audio Creation');
      expect(result).toContain(RESET);
    });
  });

  describe('formatSummary', () => {
    it('should format summary correctly', () => {
      const result = formatter.formatSummary(10, 500, 1000, 60000);
      expect(result).toContain('Voice Command Generation Summary:');
      expect(result).toContain('Total Commands Processed: 10');
      expect(result).toContain('Total Variations Generated: 500');
      expect(result).toContain('Total Audio Files Created: 1000');
      expect(result).toContain('Total Time Elapsed: 60.00 seconds');
      expect(result).toContain('Process completed successfully!');
    });
  });

  // Additional tests for private methods if they are exposed for testing purposes
  // For example, if getNextSpinnerFrame is exposed:
  // 
  // describe('getNextSpinnerFrame', () => {
  //   it('should cycle through spinner frames', () => {
  //     const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  //     for (let i = 0; i < frames.length * 2; i++) {
  //       expect(formatter['getNextSpinnerFrame']()).toBe(frames[i % frames.length]);
  //     }
  //   });
  // });
});