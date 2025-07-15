import { Request, Response } from "express";
import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  RequirePermission,
} from "../decorators";
import { RoleService } from "../services/role.service";

@Controller("/roles")
export class RoleController {
  /** 获取所有角色 */
  @RequirePermission({ resource: "role", action: "read" })
  @Get("/")
  async getAll(req: Request, res: Response) {
    const roles = await RoleService.getAllRoles();
    res.json({ message: "获取成功", data: roles });
  }

  /** 创建角色 */
  @RequirePermission({ resource: "role", action: "create" })
  @Post("/")
  async create(req: Request, res: Response) {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "角色名不能为空" });
    try {
      const role = await RoleService.createRole(name, description);
      res.status(201).json({ message: "创建成功", data: role });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 更新角色 */
  @RequirePermission({ resource: "role", action: "update" })
  @Put("/:id")
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;
    try {
      const role = await RoleService.updateRole(id, data);
      res.json({ message: "更新成功", data: role });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 根据ID删除角色 */
  @RequirePermission({ resource: "role", action: "delete" })
  @Delete("/:id")
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await RoleService.deleteRole(id);
      res.json({ message: "删除成功" });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 为角色分配权限 */
  @RequirePermission({ resource: "role", action: "grant" })
  @Post("/:id/permissions")
  async assignPermissions(req: Request, res: Response) {
    const { id } = req.params;
    const { permissionIds } = req.body;
    if (!Array.isArray(permissionIds))
      return res.status(400).json({ message: "permissionIds必须为数组" });
    try {
      await RoleService.assignPermissionsToRole(id, permissionIds);
      res.json({ message: "分配权限成功" });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 移除角色的权限 */
  @RequirePermission({ resource: "role", action: "revoke" })
  @Delete("/:id/permissions")
  async removePermissions(req: Request, res: Response) {
    const { id } = req.params;
    const { permissionIds } = req.body;
    if (!Array.isArray(permissionIds))
      return res.status(400).json({ message: "permissionIds必须为数组" });
    try {
      await RoleService.removePermissionsFromRole(id, permissionIds);
      res.json({ message: "移除权限成功" });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 获取角色的所有权限 */
  @RequirePermission({ resource: "role", action: "read" })
  @Get("/:id/permissions")
  async getRolePermissions(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const permissions = await RoleService.getRolePermissions(id);
      res.json({ message: "获取成功", data: permissions });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }
}
