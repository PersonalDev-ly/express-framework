import * as crypto from "crypto";
import { MoreThan, Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { RefreshToken } from "../entities/refresh-token.entity";
import { User } from "../entities/user.entity";
import { UserRegisterDTO } from "../models/user.model";
import { logger } from "../utils/logger";

/**
 * 用户服务类 - 处理用户相关的业务逻辑
 */
export class UserService {
  private static userRepository: Repository<User> =
    AppDataSource.getRepository(User);
  private static refreshTokenRepository: Repository<RefreshToken> =
    AppDataSource.getRepository(RefreshToken);

  /**
   * 创建新用户
   * @param userData 用户注册数据
   * @returns 创建的用户对象
   */
  static async createUser(userData: UserRegisterDTO): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    logger.info(`正在创建用户 ${userData.email}`);

    if (existingUser) {
      throw new Error("邮箱已被注册");
    }

    // 创建新用户
    const now = new Date();
    const user = this.userRepository.create({
      email: userData.email,
      password: this.hashPassword(userData.password),
      createdAt: now,
      updatedAt: now,
    });

    // 保存用户
    return await this.userRepository.save(user);
  }

  /**
   * 通过邮箱查找用户
   * @param email 用户邮箱
   * @returns 用户对象或undefined
   */
  static async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * 通过ID查找用户
   * @param id 用户ID
   * @returns 用户对象或undefined
   */
  static async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * 验证用户密码
   * @param plainPassword 明文密码
   * @param hashedPassword 哈希后的密码
   * @returns 密码是否匹配
   */
  static verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): boolean {
    const hash = crypto
      .createHash("sha256")
      .update(plainPassword)
      .digest("hex");
    return hash === hashedPassword;
  }

  /**
   * 哈希密码
   * @param password 明文密码
   * @returns 哈希后的密码
   */
  static hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  /**
   * 保存用户的刷新令牌
   * @param userId 用户ID
   * @param refreshToken 刷新令牌
   */
  static async saveRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    // 删除该用户的所有现有刷新令牌
    await this.refreshTokenRepository.delete({ userId });

    // 创建新的刷新令牌记录
    const tokenEntity = this.refreshTokenRepository.create({
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
    });

    await this.refreshTokenRepository.save(tokenEntity);
  }

  /**
   * 验证用户的刷新令牌
   * @param userId 用户ID
   * @param refreshToken 刷新令牌
   * @returns 令牌是否有效
   */
  static async validateRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<boolean> {
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: {
        userId,
        token: refreshToken,
        expiresAt: MoreThan(new Date()), // 确保令牌未过期
      },
    });

    return !!tokenEntity;
  }

  /**
   * 删除用户的刷新令牌
   * @param userId 用户ID
   */
  static async removeRefreshToken(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }
}
