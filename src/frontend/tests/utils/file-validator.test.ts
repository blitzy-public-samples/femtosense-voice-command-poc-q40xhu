import * as fs from 'fs';
import * as path from 'path';
import { validateFilePath, isValidCSVFile, validateOutputDirectory } from '../../src/utils/file-validator';
import { ERROR_MESSAGES } from '../../src/constants/cli-messages';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

describe('File Validator', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('validateFilePath', () => {
    it('should return true for valid CSV file', () => {
      // Arrange
      const filePath = '/valid/path/to/file.csv';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isFile: () => true });
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      // Act
      const result = validateFilePath(filePath, 'csv');

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for valid directory', () => {
      // Arrange
      const dirPath = '/valid/path/to/directory';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      // Act
      const result = validateFilePath(dirPath, 'directory');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', () => {
      // Arrange
      const filePath = '/invalid/path/to/file.csv';
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      console.error = jest.fn();

      // Act
      const result = validateFilePath(filePath, 'csv');

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(ERROR_MESSAGES.FILE_NOT_FOUND);
    });

    it('should return false for wrong file type', () => {
      // Arrange
      const filePath = '/valid/path/to/file.txt';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isFile: () => true, isDirectory: () => false });
      console.error = jest.fn();

      // Act
      const result = validateFilePath(filePath, 'directory');

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(`${ERROR_MESSAGES.INVALID_OUTPUT_DIR} Expected a directory, but found a file.`);
    });

    it('should return false for file without read permissions', () => {
      // Arrange
      const filePath = '/valid/path/to/file.csv';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isFile: () => true });
      (fs.accessSync as jest.Mock).mockImplementation(() => { throw new Error('Permission denied'); });
      console.error = jest.fn();

      // Act
      const result = validateFilePath(filePath, 'csv');

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(`${ERROR_MESSAGES.FILE_NOT_FOUND} File is not readable or writable.`);
    });
  });

  describe('isValidCSVFile', () => {
    it('should return true for valid CSV format', () => {
      // Arrange
      const filePath = '/valid/path/to/file.csv';
      (path.extname as jest.Mock).mockReturnValue('.csv');
      (fs.readFileSync as jest.Mock).mockReturnValue('intent,phrase\nINTENT1,Phrase 1\nINTENT2,Phrase 2');

      // Act
      const result = isValidCSVFile(filePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid CSV headers', () => {
      // Arrange
      const filePath = '/valid/path/to/file.csv';
      (path.extname as jest.Mock).mockReturnValue('.csv');
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid,headers\nINTENT1,Phrase 1');
      console.error = jest.fn();

      // Act
      const result = isValidCSVFile(filePath);

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(`${ERROR_MESSAGES.FILE_NOT_FOUND} CSV file must contain 'intent' and 'phrase' columns.`);
    });

    it('should return false for empty CSV file', () => {
      // Arrange
      const filePath = '/valid/path/to/file.csv';
      (path.extname as jest.Mock).mockReturnValue('.csv');
      (fs.readFileSync as jest.Mock).mockReturnValue('');
      console.error = jest.fn();

      // Act
      const result = isValidCSVFile(filePath);

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(`${ERROR_MESSAGES.FILE_NOT_FOUND} CSV file must contain at least a header and one data row.`);
    });

    it('should return false for non-CSV file', () => {
      // Arrange
      const filePath = '/valid/path/to/file.txt';
      (path.extname as jest.Mock).mockReturnValue('.txt');
      console.error = jest.fn();

      // Act
      const result = isValidCSVFile(filePath);

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(`${ERROR_MESSAGES.FILE_NOT_FOUND} File must have a .csv extension.`);
    });
  });

  describe('validateOutputDirectory', () => {
    it('should return true for existing directory with write permissions', () => {
      // Arrange
      const dirPath = '/valid/path/to/directory';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      // Act
      const result = validateOutputDirectory(dirPath);

      // Assert
      expect(result).toBe(true);
    });

    it('should create directory if it doesn\'t exist', () => {
      // Arrange
      const dirPath = '/new/path/to/directory';
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.accessSync as jest.Mock).mockImplementation(() => {});

      // Act
      const result = validateOutputDirectory(dirPath);

      // Assert
      expect(result).toBe(true);
      expect(fs.mkdirSync).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should return false for directory without write permissions', () => {
      // Arrange
      const dirPath = '/valid/path/to/directory';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.accessSync as jest.Mock).mockImplementation(() => { throw new Error('Permission denied'); });
      console.error = jest.fn();

      // Act
      const result = validateOutputDirectory(dirPath);

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(`${ERROR_MESSAGES.INVALID_OUTPUT_DIR} Directory is not writable.`);
    });

    it('should return false for invalid path', () => {
      // Arrange
      const dirPath = '/invalid/path/to/directory';
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => { throw new Error('Invalid path'); });
      console.error = jest.fn();

      // Act
      const result = validateOutputDirectory(dirPath);

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error validating output directory: Error: Invalid path');
    });
  });
});