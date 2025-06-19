import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/user.service";
import { JwtUtil } from "../utils/jwt.util";
import { TokenBlacklistUtil } from "../utils/token-blacklist.util";

/**
 * 认证中间件 - 验证用户是否已登录
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 从请求头中获取token
    const authHeader = req.headers.authorization;
    const token = JwtUtil.extractTokenFromHeader(authHeader);

    // 验证token
    const payload = JwtUtil.verifyAccessToken(token);

    // 检查令牌是否在黑名单中
    if (TokenBlacklistUtil.isBlacklisted(token)) {
      return res.status(401).json({ message: "未授权：令牌已被吊销" });
    }

    // 查找用户
    const user = await UserService.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "未授权：用户不存在" });
    }

    // 将用户信息添加到请求对象中
    (req as any).user = {
      id: user.id,
      email: user.email,
    };

    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "未授权：" + (error as Error).message });
  }
}

/**
 * 认证装饰器 - 用于控制器方法
 */
export function Auth() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      try {
        // 直接调用中间件，不使用回调
        await authMiddleware(req, res, () => {});

        // 如果响应已发送，不执行原始方法
        if (res.headersSent) {
          return;
        }

        // 执行原始方法
        return originalMethod.call(this, req, res, next);
      } catch (error) {
        // 如果响应尚未发送，发送错误响应
        if (!res.headersSent) {
          return res.status(401).json({
            message: "认证失败：" + (error as Error).message,
          });
        }
      }
    };

    return descriptor;
  };
}
