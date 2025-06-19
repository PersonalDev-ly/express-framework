import { Request, Response } from "express";
import { Controller, Post } from "../decorators";
import { UserLoginDTO, UserRegisterDTO } from "../models/user.model";
import { UserService } from "../services/user.service";
import { JwtUtil } from "../utils/jwt.util";

@Controller("/auth")
export class AuthController {
  /**
   * 用户注册
   * @param req 请求对象
   * @param res 响应对象
   */
  @Post("/register")
  async register(req: Request, res: Response) {
    try {
      const userData: UserRegisterDTO = req.body;

      // 验证请求数据
      if (!userData.email || !userData.password) {
        return res.status(400).json({ message: "邮箱和密码不能为空" });
      }

      // 创建用户
      const user = await UserService.createUser(userData);

      // 生成令牌
      const { accessToken, refreshToken } = JwtUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      // 保存刷新令牌
      UserService.saveRefreshToken(user.id, refreshToken);

      // 返回结果
      return res.status(201).json({
        message: "注册成功",
        data: {
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      return res.status(400).json({
        message: "注册失败：" + (error as Error).message,
      });
    }
  }

  /**
   * 用户登录
   * @param req 请求对象
   * @param res 响应对象
   */
  @Post("/login")
  async login(req: Request, res: Response) {
    try {
      const loginData: UserLoginDTO = req.body;

      // 验证请求数据
      if (!loginData.email || !loginData.password) {
        return res.status(400).json({ message: "邮箱和密码不能为空" });
      }

      // 查找用户
      const user = await UserService.findByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ message: "用户不存在" });
      }

      // 验证密码
      if (!UserService.verifyPassword(loginData.password, user.password)) {
        return res.status(401).json({ message: "密码错误" });
      }

      // 生成令牌
      const { accessToken, refreshToken } = JwtUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      // 保存刷新令牌
      UserService.saveRefreshToken(user.id, refreshToken);

      // 返回结果
      return res.status(200).json({
        message: "登录成功",
        data: {
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      return res.status(400).json({
        message: "登录失败：" + (error as Error).message,
      });
    }
  }

  /**
   * 刷新访问令牌
   * @param req 请求对象
   * @param res 响应对象
   */
  @Post("/refresh")
  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "刷新令牌不能为空" });
      }

      // 验证刷新令牌
      const payload = JwtUtil.verifyRefreshToken(refreshToken);

      // 查找用户
      const user = await UserService.findById(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "用户不存在" });
      }

      // 验证刷新令牌是否与存储的一致
      if (!UserService.validateRefreshToken(user.id, refreshToken)) {
        return res.status(401).json({ message: "刷新令牌无效" });
      }

      // 生成新的令牌对
      const tokens = JwtUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      // 更新存储的刷新令牌
      UserService.saveRefreshToken(user.id, tokens.refreshToken);

      // 返回新的令牌对
      return res.status(200).json({
        message: "令牌刷新成功",
        data: {
          tokens,
        },
      });
    } catch (error) {
      return res.status(401).json({
        message: "令牌刷新失败：" + (error as Error).message,
      });
    }
  }
}
