import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { User, UserRegisterDTO } from "../models/user.model";

/**
 * 用户服务类 - 处理用户相关的业务逻辑
 * 注意：这是一个简单的内存存储实现，仅用于演示目的
 * 在实际应用中，应该使用数据库来存储用户信息
 */
export class UserService {
  private static users: Map<string, User> = new Map();
  private static refreshTokens: Map<string, string> = new Map(); // userId -> refreshToken

  /**
   * 创建新用户
   * @param userData 用户注册数据
   * @returns 创建的用户对象
   */
  static async createUser(userData: UserRegisterDTO): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = Array.from(this.users.values()).find(
      (user) => user.email === userData.email
    );

    if (existingUser) {
      throw new Error("邮箱已被注册");
    }

    // 创建新用户
    const now = new Date();
    const newUser: User = {
      id: uuidv4(),
      email: userData.email,
      password: this.hashPassword(userData.password),
      createdAt: now,
      updatedAt: now,
    };

    // 保存用户
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  /**
   * 通过邮箱查找用户
   * @param email 用户邮箱
   * @returns 用户对象或undefined
   */
  static async findByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  /**
   * 通过ID查找用户
   * @param id 用户ID
   * @returns 用户对象或undefined
   */
  static async findById(id: string): Promise<User | undefined> {
    return this.users.get(id);
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
  static saveRefreshToken(userId: string, refreshToken: string): void {
    this.refreshTokens.set(userId, refreshToken);
  }

  /**
   * 验证用户的刷新令牌
   * @param userId 用户ID
   * @param refreshToken 刷新令牌
   * @returns 令牌是否有效
   */
  static validateRefreshToken(userId: string, refreshToken: string): boolean {
    const storedToken = this.refreshTokens.get(userId);
    return storedToken === refreshToken;
  }

  /**
   * 删除用户的刷新令牌
   * @param userId 用户ID
   */
  static removeRefreshToken(userId: string): void {
    this.refreshTokens.delete(userId);
  }
}
