import { requirePermission } from "../middleware/rbac.middleware";
import { Use } from "./middleware.decorator";

/**
 * 权限检查装饰器，用于检查用户是否具有特定权限
 * @param opts 权限校验参数（支持单个或多个权限，mode可选any/all）
 */
export function RequirePermission(
  opts:
    | { resource?: string; action?: string; name?: string }
    | {
        permissions: { resource?: string; action?: string; name?: string }[];
        mode?: "any" | "all";
      }
): MethodDecorator {
  return Use(requirePermission(opts));
}
