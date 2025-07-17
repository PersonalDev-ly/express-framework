import { Application, NextFunction, Request, Response } from 'express';
import { extractParamValue } from '../decorators';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  Constructor,
  CONTROLLER_METADATA,
  PARAM_METADATA,
  ParamMetadata,
  ROUTE_METADATA,
} from '../types';
import { logger } from './logger';

/**
 * 注册控制器类到Express应用
 * @param app Express应用实例
 * @param controllers 控制器类数组
 */
export function registerControllers(
  app: Application,
  controllers: Constructor[],
): void {
  for (const controller of controllers) {
    registerController(app, controller);
  }
}

/**
 * 注册单个控制器到Express应用
 * @param app Express应用实例
 * @param Controller 控制器类
 */
function registerController(app: Application, Controller: Constructor): void {
  // 获取控制器元数据
  const controllerMetadata = Reflect.getMetadata(
    CONTROLLER_METADATA,
    Controller,
  );
  if (!controllerMetadata) {
    return;
  }

  const { basePath } = controllerMetadata;
  const controllerInstance = new Controller();

  // 获取路由元数据
  const routes = Reflect.getMetadata(ROUTE_METADATA, Controller) || [];

  // 注册每个路由
  for (const route of routes) {
    const { method, path, methodName, middleware } = route;
    const fullPath = `${basePath}${path}`;

    // 检查是否允许匿名访问
    const isAllowAnonymous = Reflect.getMetadata(
      'allow_anonymous',
      Controller,
      methodName,
    );

    // 组装中间件，默认加authMiddleware，除非允许匿名
    const finalMiddleware = isAllowAnonymous
      ? middleware
      : [authMiddleware, ...middleware];

    // 创建路由处理函数
    const handler = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        // 获取参数元数据
        const paramMetadata: ParamMetadata[] =
          Reflect.getMetadata(PARAM_METADATA, Controller, methodName) || [];

        // 准备方法参数
        const args = prepareMethodArguments(req, res, next, paramMetadata);

        // 调用控制器方法
        const result = await controllerInstance[methodName as string](...args);

        // 如果结果已经被发送（例如，在控制器中直接调用了res.send()），则不做任何事
        if (res.headersSent) {
          return;
        }

        // 否则发送结果
        res.send(result);
      } catch (error) {
        next(error);
      }
    };

    // 注册路由
    (app as any)[method.toLowerCase()](fullPath, ...finalMiddleware, handler);

    logger.debug(`Registered route: [${method}] ${fullPath}`);
  }
}

/**
 * 准备控制器方法的参数
 * @param req Express请求对象
 * @param res Express响应对象
 * @param next Express下一个中间件函数
 * @param paramMetadata 参数元数据
 */
function prepareMethodArguments(
  req: Request,
  res: Response,
  next: NextFunction,
  paramMetadata: ParamMetadata[],
): any[] {
  // 默认参数是请求、响应和next函数
  const defaultArgs: any[] = [req, res, next];

  // 如果没有参数元数据，返回默认参数
  if (!paramMetadata || paramMetadata.length === 0) {
    return defaultArgs;
  }

  // 创建参数数组
  const args = new Array(Math.max(...paramMetadata.map((p) => p.index)) + 1);

  // 填充参数数组
  for (const { index, type, name } of paramMetadata) {
    args[index] = extractParamValue(req, type, name);
  }

  // 填充未定义的参数位置
  for (let i = 0; i < args.length; i++) {
    if (args[i] === undefined) {
      // 如果索引小于默认参数长度，使用默认参数
      if (i < defaultArgs.length) {
        args[i] = defaultArgs[i];
      } else {
        args[i] = undefined;
      }
    }
  }

  return args;
}
