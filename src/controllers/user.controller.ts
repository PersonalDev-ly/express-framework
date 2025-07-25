import { Request, Response } from 'express';
import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  RequirePermission,
} from '../decorators';
import { toUserProfile } from '../models/user.model';
import { UserService } from '../services/user.service';
import { HashPassword } from '../utils/hash-password-bcrypt';

@Controller('/users')
export class UserController {
  /** 获取所有用户 */
  @RequirePermission({ resource: 'user', action: 'read' })
  @Get('/')
  async getAllUsers(_req: Request, res: Response): Promise<void | Response> {
    try {
      // 查找所有用户
      const users = await UserService.getAllUsers();
      return res.status(200).json({
        message: '获取用户成功',
        data: users,
      });
    } catch (error) {
      return res.status(400).json({
        message: '获取用户失败：' + (error as Error).message,
      });
    }
  }

  /** 根据ID获取用户信息 */
  @RequirePermission({ resource: 'user', action: 'read' })
  @Get('/:id')
  async getUserById(req: Request, res: Response): Promise<void | Response> {
    try {
      // 从请求对象中获取用户ID
      const { id } = req.params;
      // 查找指定用户
      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      // 返回用户信息
      return res.status(200).json({
        message: '获取用户成功',
        data: user,
      });
    } catch (error) {
      return res.status(400).json({
        message: '获取用户失败：' + (error as Error).message,
      });
    }
  }

  /** 修改用户信息 */
  @RequirePermission({ resource: 'user', action: 'update' })
  @Put('/:id')
  async updateUserById(req: Request, res: Response): Promise<void | Response> {
    try {
      // 从请求对象中获取用户ID
      const { id } = req.params;
      // 查找指定用户
      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      // 更新用户信息
      const { username, password } = req.body;
      if (username) user.username = username;
      if (password) user.password = await HashPassword.hashPassword(password);
      // 保存用户信息
      const userData = await UserService.updateUserById(user);
      // 返回用户信息
      return res.status(200).json({
        message: '更新用户成功',
        data: toUserProfile(userData),
      });
    } catch (error) {
      return res.status(400).json({
        message: '更新用户失败：' + (error as Error).message,
      });
    }
  }

  /** 删除用户 */
  @RequirePermission({ resource: 'user', action: 'delete' })
  @Delete('/:id')
  async deleteUserById(req: Request, res: Response): Promise<void | Response> {
    try {
      // 从请求对象中获取用户ID
      const { id } = req.params;
      // 查找指定用户
      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }
      // 删除用户
      await UserService.deleteUserById(id);
      // 返回成功消息
      return res.status(200).json({
        message: '删除用户成功',
      });
    } catch (error) {
      return res.status(400).json({
        message: '删除用户失败：' + (error as Error).message,
      });
    }
  }

  /** 批量删除用户 */
  @RequirePermission({ resource: 'user', action: 'delete' })
  @Delete('/')
  async deleteUsers(req: Request, res: Response): Promise<void | Response> {
    try {
      // 从请求对象中获取用户ID列表
      const { ids } = req.body;
      // 删除用户
      await UserService.deleteUsers(ids);
      // 返回成功消息
      return res.status(200).json({
        message: '删除用户成功',
      });
    } catch (error) {
      return res.status(400).json({
        message: '删除用户失败：' + (error as Error).message,
      });
    }
  }

  /** 创建用户 */
  @RequirePermission({ resource: 'user', action: 'create' })
  @Post('/')
  async createUser(req: Request, res: Response): Promise<void | Response> {
    try {
      // 从请求对象中获取用户信息
      const userData = req.body;
      // 创建用户
      const user = await UserService.createUser(userData);
      // 返回用户信息
      return res.status(201).json({
        message: '创建用户成功',
        data: toUserProfile(user),
      });
    } catch (error) {
      return res.status(400).json({
        message: '创建用户失败：' + (error as Error).message,
      });
    }
  }

  /** 为用户分配角色 */
  @RequirePermission({ resource: 'user', action: 'grant' })
  @Post('/:id/roles')
  async assignRolesToUser(
    req: Request,
    res: Response,
  ): Promise<void | Response> {
    try {
      const { id } = req.params;
      const { roles } = req.body;
      const res_flg = await UserService.assignRolesToUser(id, roles);
      if (!res_flg) {
        return res.status(400).json({
          message: '为用户分配角色失败：角色不存在',
        });
      }
      return res.status(200).json({
        message: '为用户分配角色成功',
      });
    } catch (error) {
      return res.status(400).json({
        message: '为用户分配角色失败：' + (error as Error).message,
      });
    }
  }

  /** 获取指定用户具备哪些角色 */
  @RequirePermission({ resource: 'user', action: 'read' })
  @Get('/:id/roles')
  async getUserRoles(req: Request, res: Response): Promise<void | Response> {
    try {
      const { id } = req.params;
      const roles = await UserService.getUserRoles(id);
      return res.status(200).json({
        message: '获取用户角色成功',
        data: roles,
      });
    } catch (error) {
      return res.status(400).json({
        message: '获取用户角色失败：' + (error as Error).message,
      });
    }
  }

  /** 移除指定用户下的角色 */
  @RequirePermission({ resource: 'user', action: 'grant' })
  @Delete('/:id/roles')
  async removeRolesFromUser(
    req: Request,
    res: Response,
  ): Promise<void | Response> {
    try {
      const { id } = req.params;
      const { roles } = req.body;
      const res_flg = await UserService.removeRolesFromUser(id, roles);
      if (!res_flg) {
        return res.status(400).json({
          message: '为用户移除角色失败：角色不存在',
        });
      }
      return res.status(200).json({
        message: '为用户移除角色成功',
      });
    } catch (error) {
      return res.status(400).json({
        message: '为用户移除角色失败：' + (error as Error).message,
      });
    }
  }

  /** 获取用户的权限 */
  @RequirePermission({ resource: 'user', action: 'read' })
  @Get('/:id/permissions/')
  async getUserPermissions(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const permissions = await UserService.getUserPermissions(id);
      res.json({ message: '获取成功', data: permissions });
    } catch (e) {
      res.status(400).json({ message: (e as Error).message });
    }
  }
}
