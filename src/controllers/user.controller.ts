import { Request, Response } from "express";
import { Controller, Get, Put, RequirePermission } from "../decorators";
import { UserService } from "../services/user.service";

@Controller("/users")
export class UserController {
  /**
   * 获取所有用户
   * @param req 请求对象
   * @param res 响应对象
   */
  @RequirePermission({ resource: "user", action: "read" })
  @Get("/")
  async getAllUsers(req: Request, res: Response) {
    try {
      // 查找所有用户
      const users = await UserService.getAllUsers();
      return res.status(200).json({
        message: "获取用户成功",
        data: users,
      });
    } catch (error) {
      return res.status(400).json({
        message: "获取用户失败：" + (error as Error).message,
      });
    }
  }

  /**
   * 获取指定用户
   * @param req 请求对象
   * @param res 响应对象
   */
  @RequirePermission({ resource: "user", action: "read" })
  @Get("/:id")
  async getUserById(req: Request, res: Response) {
    try {
      // 从请求对象中获取用户ID
      const { id } = req.params;
      // 查找指定用户
      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "用户不存在" });
      }
      // 返回用户信息
      return res.status(200).json({
        message: "获取用户成功",
        data: user,
      });
    } catch (error) {
      return res.status(400).json({
        message: "获取用户失败：" + (error as Error).message,
      });
    }
  }

  /**
   * 修改用户信息
   * @param req 请求对象
   * @param res 响应对象
   */
  @RequirePermission({ resource: "user", action: "update" })
  @Put("/:id")
  async updateUserById(req: Request, res: Response) {
    try {
      // 从请求对象中获取用户ID
      const { id } = req.params;
      // 查找指定用户
      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "用户不存在" });
      }
      // 更新用户信息
      const { username, email, password } = req.body;
      if (username) user.username = username;
      if (password) user.password = password;
      // 保存用户信息
      //   await UserService.saveUser(user);
      // 返回用户信息
      return res.status(200).json({
        message: "更新用户成功",
        data: user,
      });
    } catch (error) {
      return res.status(400).json({
        message: "更新用户失败：" + (error as Error).message,
      });
    }
  }
}
