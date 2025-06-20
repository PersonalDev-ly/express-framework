import { Request, Response } from "express";
import {Auth, Controller, Get} from "../decorators";
import { UserService } from "../services/user.service";

@Controller("/profile")
export class ProfileController {
  /**
   * 获取当前用户资料
   * @param req 请求对象
   * @param res 响应对象
   */
  @Auth()
  @Get("/")
  async getProfile(req: Request, res: Response) {
    try {
      // 从请求对象中获取用户信息（由auth中间件添加）
      const currentUser = (req as any).user;

      // 查找完整的用户信息
      const user = await UserService.findById(currentUser.id);

      if (!user) {
        return res.status(404).json({ message: "用户不存在" });
      }

      // 返回用户资料（不包含敏感信息）
      return res.status(200).json({
        message: "获取资料成功",
        data: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      return res.status(400).json({
        message: "获取资料失败：" + (error as Error).message,
      });
    }
  }
}
