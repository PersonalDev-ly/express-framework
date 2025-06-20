import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UnauthorizedError } from "../types/errors";

/**
 * RBAC中间件 - 加载用户的角色和权限信息
 */
export const rbacMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return next();
    }

    const [roles, permissions] = await Promise.all([
      UserService.getUserRoles(req.user.id),
      UserService.getUserPermissions(req.user.id),
    ]);

    req.user.roles = roles.map((role) => role.name);
    req.user.permissions = permissions.map((permission) => ({
      resource: permission.resource,
      action: permission.action,
      name: permission.name,
    }));

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 权限检查中间件工厂
 * @param permissionName 需要检查的权限名称
 */
export const requirePermission = (permissionName: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      const hasPermission = await UserService.hasPermission(
        req.user.id,
        permissionName
      );

      if (!hasPermission) {
        throw new UnauthorizedError(
          `Missing required permission: ${permissionName}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
