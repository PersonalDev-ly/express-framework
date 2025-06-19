import { authMiddleware } from "../middleware/auth.middleware";
import { Use } from "./middleware.decorator";

/**
 * Auth装饰器，用于标记需要JWT认证的路由
 * 使用方式：@Auth()
 */
export function Auth(): MethodDecorator {
  return Use(authMiddleware);
}
