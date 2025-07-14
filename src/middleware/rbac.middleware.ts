import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/user.service";
import { UnauthorizedError } from "../types/errors";

/**
 * 权限检查中间件工厂
 * @param opts 权限校验参数（支持单个或多个权限，mode可选any/all）
 */
export const requirePermission = (
  opts:
    | { resource?: string; action?: string; name?: string }
    | {
        permissions: { resource?: string; action?: string; name?: string }[];
        mode?: "any" | "all";
      }
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }
      // 超级管理员直接放行
      if (req.user.isSuperAdmin) {
        return next();
      }
      let hasPermission: boolean;
      if ("permissions" in opts && Array.isArray(opts.permissions)) {
        if (opts.mode === "all") {
          hasPermission = await UserService.hasAllPermissions(
            req.user.id,
            opts.permissions
          );
        } else {
          hasPermission = await UserService.hasAnyPermission(
            req.user.id,
            opts.permissions
          );
        }
      } else {
        hasPermission = await UserService.hasPermission(
          req.user.id,
          opts as any
        );
      }
      if (!hasPermission) {
        let msg = "Missing required permission: ";
        if ("permissions" in opts && Array.isArray(opts.permissions)) {
          msg += JSON.stringify(opts.permissions);
        } else {
          const single = opts as {
            resource?: string;
            action?: string;
            name?: string;
          };
          msg += single.resource
            ? single.resource + ":" + single.action
            : single.name;
        }
        throw new UnauthorizedError(msg);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
