import { NextFunction, Request, Response } from 'express';
import { BaseError } from '../types/errors';
import { logger } from '../utils/logger';

/**
 * 全局错误处理中间件
 * 处理应用中的所有错误，并返回统一的错误响应格式
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // 默认错误状态码和错误代码
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let errorMessage = '服务器内部错误';
  let errorDetails: any = undefined;
  let isOperational = false;

  // 记录请求信息
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: (req as any).user?.id || '未登录',
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    headers: {
      'user-agent': req.headers['user-agent'],
      referer: req.headers.referer,
      // 可以添加其他需要记录的请求头
    },
  };

  // 处理自定义错误
  if (err instanceof BaseError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    errorMessage = err.message;
    errorDetails = err.details;
    isOperational = err.isOperational;
  }
  // 处理Express的SyntaxError (JSON解析错误)
  else if (
    err instanceof SyntaxError &&
    (err as any).status === 400 &&
    'body' in err
  ) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    errorMessage = '无效的JSON格式';
  }
  // 处理其他类型的错误
  else {
    // 保持默认值
    errorDetails = process.env.NODE_ENV !== 'production' ? err : undefined;
  }

  // 构建错误响应对象
  const errorResponse = {
    error: {
      status: statusCode,
      code: errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  };

  // 在开发环境下添加错误详情
  if (process.env.NODE_ENV !== 'production' && errorDetails) {
    (errorResponse.error as any).details = errorDetails;
  }

  // 记录错误日志
  if (isOperational) {
    logger.warn(`[${statusCode}] ${errorCode}: ${errorMessage}`, {
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      },
      request: requestInfo,
      response: {
        statusCode,
        errorCode,
      },
    });
  } else {
    logger.error(`[${statusCode}] ${errorCode}: ${errorMessage}`, {
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      },
      request: requestInfo,
      response: {
        statusCode,
        errorCode,
      },
    });
  }

  // 发送错误响应
  res.status(statusCode).json(errorResponse);
};

/**
 * 404错误处理中间件
 * 处理未匹配任何路由的请求
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const error = new Error(`找不到路径: ${req.originalUrl}`);
  (error as any).statusCode = 404;
  (error as any).code = 'NOT_FOUND';
  next(error);
};

/**
 * 异步错误处理包装器
 * 捕获异步路由处理器中的错误并传递给错误处理中间件
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 设置全局未捕获异常处理
 * 处理未被捕获的异常和Promise拒绝
 */
export const setupGlobalErrorHandlers = (): void => {
  // 处理未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    logger.error('未捕获的异常', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });

    // 给进程一些时间来记录错误，然后退出
    console.error('未捕获的异常:', error);

    // 在生产环境中，最好在记录错误后优雅地关闭应用
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });

  // 处理未处理的Promise拒绝
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('未处理的Promise拒绝', {
      reason:
        reason instanceof Error
          ? {
              name: reason.name,
              message: reason.message,
              stack: reason.stack,
            }
          : reason,
      promise,
    });

    // 在开发环境中，将未处理的Promise拒绝转换为未捕获的异常
    if (process.env.NODE_ENV !== 'production') {
      throw reason;
    }
  });
};
