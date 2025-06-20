import { authMiddleware } from "../middleware/auth.middleware";
import { Use } from "./middleware.decorator";

/**
 * Auth装饰器，用于标记需要JWT认证的路由
 * 使用方式：@Auth()
 */
export function Auth(): MethodDecorator {
  return Use(authMiddleware);
}

/**
 * 允许匿名访问装饰器，用于标记无需登录校验的方法
 * 用法：@AllowAnonymous()
 */
export function AllowAnonymous(): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('allow_anonymous', true, target.constructor, propertyKey!);
    return descriptor;
  };
}
