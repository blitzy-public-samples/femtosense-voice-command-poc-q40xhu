import { jest } from '@jest/globals';
import axios from 'axios';
import * as fs from 'fs';
import { generateCommand } from '../../src/commands/generate';
import { CLIOptions } from '../../src/interfaces/cli-options.interface';
import { ProgressTracker } from '../../src/utils/progress-tracker';
import { OutputFormatter } from '../../src/utils/output-formatter';

// Mock the dependencies
jest.mock('axios');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));
jest.mock('../../src/utils/progress-tracker');
jest.mock('../../src/utils/output-formatter');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockProgressTracker = ProgressTracker as jest.Mocked<typeof ProgressTracker>;
const mockOutputFormatter = OutputFormatter as jest.Mocked<typeof OutputFormatter>;

describe('Generate Command', () => {
  const defaultOptions: CLIOptions = {
    apikey: 'test-api-key',
    language: 'korean',
    intent_csv: 'test.csv',
    outdir: 'test-output',
    skip_header: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.post.mockReset();
    mockProgressTracker.prototype.setStage.mockReset();
    mockProgressTracker.prototype.updateProgress.mockReset();
    mockProgressTracker.prototype.addError.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const testGenerateCommand = async (options: CLIOptions = defaultOptions) => {
    await generateCommand(options);
  };

  it('should successfully generate variations and audio files', async () => {
    // Mock input file content
    const mockFileContent = 'phrase1\nphrase2\nphrase3';
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent);

    // Mock API responses
    mockAxios.post.mockResolvedValueOnce({ data: { variations: ['var1', 'var2'] } });
    mockAxios.post.mockResolvedValueOnce({ data: Buffer.from('audio-data') });

    await testGenerateCommand();

    // Verify progress tracking calls
    expect(mockProgressTracker.prototype.setStage).toHaveBeenCalledWith('INPUT_PROCESSING');
    expect(mockProgressTracker.prototype.setStage).toHaveBeenCalledWith('VARIATION_GENERATION');
    expect(mockProgressTracker.prototype.setStage).toHaveBeenCalledWith('AUDIO_GENERATION');
    expect(mockProgressTracker.prototype.setStage).toHaveBeenCalledWith('AWS_UPLOAD');

    // Verify API calls
    expect(mockAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/variations'),
      expect.objectContaining({ phrase: 'phrase1', language: 'korean', count: 50 }),
      expect.any(Object)
    );
    expect(mockAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/audio'),
      expect.objectContaining({ text: 'var1', language: 'korean' }),
      expect.any(Object)
    );

    // Verify file operations
    expect(fs.promises.mkdir).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    // Mock input file content
    const mockFileContent = 'phrase1';
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent);

    // Mock API error
    mockAxios.post.mockRejectedValueOnce(new Error('API Error'));

    await testGenerateCommand();

    // Verify error tracking
    expect(mockProgressTracker.prototype.addError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to generate variations'),
      'phrase1'
    );
  });

  it('should process multiple phrases correctly', async () => {
    // Mock input file content with multiple phrases
    const mockFileContent = 'phrase1\nphrase2\nphrase3';
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent);

    // Mock successful API responses for all phrases
    mockAxios.post.mockResolvedValue({ data: { variations: ['var1', 'var2'] } });

    await testGenerateCommand();

    // Verify that the variation generation API was called for each phrase
    expect(mockAxios.post).toHaveBeenCalledTimes(6); // 3 for variations, 3 for audio
    expect(mockProgressTracker.prototype.updateProgress).toHaveBeenCalledTimes(6);
  });

  it('should respect skip_header option', async () => {
    const optionsWithSkipHeader: CLIOptions = { ...defaultOptions, skip_header: 2 };
    const mockFileContent = 'header1\nheader2\nphrase1\nphrase2';
    (fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent);

    mockAxios.post.mockResolvedValue({ data: { variations: ['var1'] } });

    await testGenerateCommand(optionsWithSkipHeader);

    // Verify that only phrases after the skipped headers are processed
    expect(mockAxios.post).toHaveBeenCalledTimes(4); // 2 for variations, 2 for audio
    expect(mockProgressTracker.prototype.updateProgress).toHaveBeenCalledTimes(4);
  });

  it('should handle file system errors', async () => {
    // Mock file system error
    (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

    await expect(testGenerateCommand()).rejects.toThrow('Failed to process input file');

    // Verify that the error is logged
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to process input file'));
  });
});