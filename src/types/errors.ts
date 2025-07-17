/**
 * 基础错误类
 * 所有自定义错误类的基类
 */
export class BaseError extends Error {
  /** HTTP状态码 */
  public readonly statusCode: number;
  /** 错误代码 */
  public readonly code: string;
  /** 错误详情 */
  public readonly details?: any;
  /** 是否操作错误（用于区分操作错误和系统错误） */
  public readonly isOperational: boolean;

  /**
   * 构造函数
   * @param message 错误消息
   * @param statusCode HTTP状态码
   * @param code 错误代码
   * @param isOperational 是否操作错误
   * @param details 错误详情
   */
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    isOperational: boolean = true,
    details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误
 * 用于请求参数验证失败的情况
 */
export class ValidationError extends BaseError {
  constructor(message: string = '验证失败', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

/**
 * 未授权错误
 * 用于用户未登录的情况
 */
export class UnauthorizedError extends BaseError {
  constructor(message: string = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

/**
 * 禁止访问错误
 * 用于用户无权限访问的情况
 */
export class ForbiddenError extends BaseError {
  constructor(message: string = '禁止访问') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

/**
 * 资源未找到错误
 * 用于请求的资源不存在的情况
 */
export class NotFoundError extends BaseError {
  constructor(message: string = '资源未找到') {
    super(message, 404, 'NOT_FOUND', true);
  }
}

/**
 * 资源冲突错误
 * 用于资源已存在或冲突的情况
 */
export class ConflictError extends BaseError {
  constructor(message: string = '资源冲突') {
    super(message, 409, 'CONFLICT', true);
  }
}

/**
 * 请求超时错误
 * 用于请求处理超时的情况
 */
export class RequestTimeoutError extends BaseError {
  constructor(message: string = '请求处理超时') {
    super(message, 408, 'REQUEST_TIMEOUT', true);
  }
}

/**
 * 服务不可用错误
 * 用于服务暂时不可用的情况
 */
export class ServiceUnavailableError extends BaseError {
  constructor(message: string = '服务暂时不可用') {
    super(message, 503, 'SERVICE_UNAVAILABLE', true);
  }
}

/**
 * 内部服务器错误
 * 用于服务器内部错误的情况
 */
export class InternalServerError extends BaseError {
  constructor(message: string = '服务器内部错误', details?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, details);
  }
}

/**
 * 数据库错误
 * 用于数据库操作失败的情况
 */
export class DatabaseError extends BaseError {
  constructor(message: string = '数据库操作失败', details?: any) {
    super(message, 500, 'DATABASE_ERROR', false, details);
  }
}
