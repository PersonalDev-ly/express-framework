import {
  rbacMiddleware,
  requirePermission,
} from "../middleware/rbac.middleware";
import { Use } from "./middleware.decorator";

/**
 * RBAC装饰器，用于加载用户的角色和权限信息
 */
export function RBAC(): MethodDecorator {
  return Use(rbacMiddleware);
}

/**
 * 权限检查装饰器，用于检查用户是否具有特定权限
 * @param permissionName 需要检查的权限名称
 */
export function RequirePermission(permissionName: string): MethodDecorator {
  return Use(requirePermission(permissionName));
}
