import { Request, Response } from "express";
import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  RequirePermission,
} from "../decorators";
import { MenuService } from "../services/menu.service";

@Controller("/menus")
export class MenuController {
  /** 获取所有菜单 */
  @RequirePermission({ resource: "menu", action: "read" })
  @Get("/")
  async getAll(req: Request, res: Response) {
    const menus = await MenuService.getAllMenus();
    res.json({ message: "获取成功", data: menus });
  }

  /** 获取菜单树结构 */
  @RequirePermission({ resource: "menu", action: "read" })
  @Get("/tree")
  async getTree(req: Request, res: Response) {
    const tree = await MenuService.getMenuTree();
    res.json({ message: "获取成功", data: tree });
  }

  /** 创建菜单 */
  @RequirePermission({ resource: "menu", action: "create" })
  @Post("/")
  async create(req: Request, res: Response) {
    try {
      const menu = await MenuService.createMenu(req.body);
      res.status(201).json({ message: "创建成功", data: menu });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 更新菜单 */
  @RequirePermission({ resource: "menu", action: "update" })
  @Put("/:id")
  async update(req: Request, res: Response) {
    try {
      const menu = await MenuService.updateMenu(
        Number(req.params.id),
        req.body
      );
      res.json({ message: "更新成功", data: menu });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 删除菜单 */
  @RequirePermission({ resource: "menu", action: "delete" })
  @Delete("/:id")
  async delete(req: Request, res: Response) {
    try {
      await MenuService.deleteMenu(Number(req.params.id));
      res.json({ message: "删除成功" });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 为角色分配菜单 */
  @RequirePermission({ resource: "menu", action: "grant" })
  @Post("/role/:roleId")
  async assignMenus(req: Request, res: Response) {
    const roleId = req.params.roleId;
    const menuIds = Array.isArray(req.body.menuIds)
      ? req.body.menuIds.map(Number)
      : [];
    if (!Array.isArray(menuIds))
      return res.status(400).json({ message: "menuIds必须为数组" });
    try {
      await MenuService.assignMenusToRole(roleId, menuIds);
      res.json({ message: "分配菜单成功" });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 获取角色的所有菜单ID */
  @RequirePermission({ resource: "menu", action: "read" })
  @Get("/role/:roleId")
  async getRoleMenus(req: Request, res: Response) {
    const roleId = req.params.roleId;
    try {
      const menuIds = await MenuService.getRoleMenus(roleId);
      res.json({ message: "获取成功", data: menuIds });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }
}
