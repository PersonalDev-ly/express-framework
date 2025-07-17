import { Request, Response } from 'express';
import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  RequirePermission,
} from '../decorators';
import { PermissionService } from '../services/permission.service';

@Controller('/permissions')
export class PermissionController {
  /** 获取所有权限 */
  @RequirePermission({ resource: 'permission', action: 'read' })
  @Get('/')
  async getAll(_req: Request, res: Response): Promise<void> {
    const permissions = await PermissionService.getAllPermissions();
    res.json({ message: '获取成功', data: permissions });
  }

  /** 创建权限 */
  @RequirePermission({ resource: 'permission', action: 'create' })
  @Post('/')
  async create(req: Request, res: Response): Promise<void | Response> {
    const { name, description, resource, action } = req.body;
    if (!name || !resource || !action)
      return res
        .status(400)
        .json({ message: 'name、resource、action不能为空' });
    try {
      const permission = await PermissionService.createPermission(
        name,
        description,
        resource,
        action,
      );
      res.status(201).json({ message: '创建成功', data: permission });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 更新权限 */
  @RequirePermission({ resource: 'permission', action: 'update' })
  @Put('/:id')
  async update(req: Request, res: Response): Promise<void | Response> {
    const { id } = req.params;
    const data = req.body;
    try {
      const permission = await PermissionService.updatePermission(id, data);
      res.json({ message: '更新成功', data: permission });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }

  /** 删除权限 */
  @RequirePermission({ resource: 'permission', action: 'delete' })
  @Delete('/:id')
  async delete(req: Request, res: Response): Promise<void | Response> {
    const { id } = req.params;
    try {
      await PermissionService.deletePermission(id);
      res.json({ message: '删除成功' });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }
}
