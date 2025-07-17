import fs from 'fs';
import path from 'path';
import { format } from 'util';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 控制台日志级别 */
  consoleLevel: LogLevel;
  /** 文件日志级别 */
  fileLevel: LogLevel;
  /** 日志文件路径 */
  logFilePath?: string;
  /** 是否在日志中包含时间戳 */
  includeTimestamp?: boolean;
  /** 是否在日志中包含日志级别 */
  includeLogLevel?: boolean;
}

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  consoleLevel:
    process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  fileLevel: LogLevel.NONE,
  includeTimestamp: true,
  includeLogLevel: true,
};

/**
 * 日志工具类
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logStream: fs.WriteStream | null = null;
  private currentLogDate: string | null = null;

  /**
   * 获取当前日期字符串（YYYY-MM-DD格式）
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 获取带日期的日志文件路径
   */
  private getLogFilePath(): string {
    if (!this.config.logFilePath) {
      throw new Error('Log file path is not configured');
    }
    const dir = path.dirname(this.config.logFilePath);
    const ext = path.extname(this.config.logFilePath);
    const basename = path.basename(this.config.logFilePath, ext);
    return path.join(dir, `${basename}-${this.getCurrentDate()}${ext}`);
  }

  /**
   * 创建或切换日志文件流
   */
  private createOrRotateLogStream(): void {
    const currentDate = this.getCurrentDate();

    // 如果日期变化或者没有日志流，创建新的日志流
    if (currentDate !== this.currentLogDate || !this.logStream) {
      // 关闭现有的日志流（如果有）
      if (this.logStream) {
        this.logStream.end();
      }

      const logPath = this.getLogFilePath();
      const logDir = path.dirname(logPath);

      // 确保日志目录存在
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // 创建新的日志流
      this.logStream = fs.createWriteStream(logPath, { flags: 'a' });
      this.currentLogDate = currentDate;
    }
  }

  /**
   * 获取日志实例（单例模式）
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * 配置日志工具
   * @param config 日志配置
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // 如果配置了文件日志，初始化日志文件流
    if (this.config.fileLevel < LogLevel.NONE && this.config.logFilePath) {
      // 创建或切换日志流
      this.createOrRotateLogStream();
    }
  }

  /**
   * 格式化日志消息
   * @param level 日志级别
   * @param args 日志参数
   * @returns 格式化后的日志消息
   */
  private formatLogMessage(level: LogLevel, args: any[]): string {
    const parts: string[] = [];

    // 添加时间戳
    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    // 添加日志级别
    if (this.config.includeLogLevel) {
      const levelStr = LogLevel[level];
      parts.push(`[${levelStr}]`);
    }

    // 格式化消息
    const message = format(...args);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * 写入日志
   * @param level 日志级别
   * @param args 日志参数
   */
  private log(level: LogLevel, ...args: any[]): void {
    const message = this.formatLogMessage(level, args);

    // 输出到控制台
    if (level >= this.config.consoleLevel) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(message);
          break;
        case LogLevel.INFO:
          console.info(message);
          break;
        case LogLevel.WARN:
          console.warn(message);
          break;
        case LogLevel.ERROR:
          console.error(message);
          break;
      }
    }

    // 写入日志文件
    if (level >= this.config.fileLevel && this.config.logFilePath) {
      // 检查是否需要创建或切换日志文件
      this.createOrRotateLogStream();

      if (this.logStream) {
        this.logStream.write(`${message}\n`);
      }
    }
  }

  /**
   * 调试级别日志
   * @param args 日志参数
   */
  public debug(...args: any[]): void {
    this.log(LogLevel.DEBUG, ...args);
  }

  /**
   * 信息级别日志
   * @param args 日志参数
   */
  public info(...args: any[]): void {
    this.log(LogLevel.INFO, ...args);
  }

  /**
   * 警告级别日志
   * @param args 日志参数
   */
  public warn(...args: any[]): void {
    this.log(LogLevel.WARN, ...args);
  }

  /**
   * 错误级别日志
   * @param args 日志参数
   */
  public error(...args: any[]): void {
    this.log(LogLevel.ERROR, ...args);
  }
}

// 导出默认实例
export const logger = Logger.getInstance();

// 导出便捷函数
export const debug = (...args: any[]) => logger.debug(...args);
export const info = (...args: any[]) => logger.info(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);
