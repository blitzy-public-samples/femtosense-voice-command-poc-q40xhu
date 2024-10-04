import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

// Import the logging configuration
const loggingConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/logging-config.json'), 'utf8'));

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define color scheme
const colorScheme = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Create the logger
class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
    this.initializeLogger();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private initializeLogger() {
    const { format } = winston;
    const { combine, timestamp, printf, colorize } = format;

    // Create log directory if it doesn't exist
    const logDir = path.dirname(loggingConfig.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Define log format
    const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp} ${level}: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    });

    // Configure transports
    const transports: winston.transport[] = [
      new winston.transports.Console({
        level: loggingConfig.logLevel,
        format: combine(
          colorize({ all: true }),
          timestamp(),
          logFormat
        ),
      }),
      new DailyRotateFile({
        filename: loggingConfig.logFile,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: loggingConfig.rotation.compress,
        maxSize: loggingConfig.rotation.maxSize,
        maxFiles: loggingConfig.rotation.maxFiles,
        format: combine(
          timestamp(),
          logFormat
        ),
      }),
    ];

    // Create the logger
    this.logger = winston.createLogger({
      level: loggingConfig.logLevel,
      levels: logLevels,
      format: combine(
        timestamp(),
        logFormat
      ),
      transports,
      defaultMeta: loggingConfig.additional_fields,
    });

    // Add category-specific loggers
    Object.entries(loggingConfig.categories).forEach(([category, config]: [string, any]) => {
      this.logger.add(new winston.transports.File({
        filename: config.logFile || `./logs/${category}.log`,
        level: config.logLevel,
        format: combine(
          timestamp(),
          printf(({ level, message, timestamp }) => {
            return `${timestamp} ${category.toUpperCase()} - ${level}: ${message}`;
          })
        ),
      }));
    });
  }

  public log(level: string, message: string, meta: Record<string, unknown> = {}): void {
    // Mask sensitive data
    if (loggingConfig.sensitive_data.mask) {
      meta = this.maskSensitiveData(meta);
    }

    // Log performance if enabled and threshold is met
    if (loggingConfig.performance_logging.enabled && meta.duration && (meta.duration as number) > loggingConfig.performance_logging.threshold) {
      this.logger.warn(`Performance threshold exceeded: ${message}`, { ...meta, performance_alert: true });
    }

    this.logger.log(level, message, meta);
  }

  public error(message: string, meta: Record<string, unknown> = {}): void {
    this.log('error', message, meta);
  }

  public warn(message: string, meta: Record<string, unknown> = {}): void {
    this.log('warn', message, meta);
  }

  public info(message: string, meta: Record<string, unknown> = {}): void {
    this.log('info', message, meta);
  }

  public debug(message: string, meta: Record<string, unknown> = {}): void {
    this.log('debug', message, meta);
  }

  private maskSensitiveData(meta: Record<string, unknown>): Record<string, unknown> {
    const maskedMeta = { ...meta };
    loggingConfig.sensitive_data.fields.forEach((field: string) => {
      if (field in maskedMeta) {
        maskedMeta[field] = '********';
      }
    });
    return maskedMeta;
  }
}

// Export the logger instance
export const logger = Logger.getInstance();

// Export log level type for type checking
export type LogLevel = keyof typeof logLevels;