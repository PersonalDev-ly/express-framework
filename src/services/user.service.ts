import * as crypto from "crypto";
import { MoreThan, Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Permission } from "../entities/permission.entity";
import { RefreshToken } from "../entities/refresh-token.entity";
import { Role } from "../entities/role.entity";
import { UserRole } from "../entities/user-role.entity";
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
  // 角色管理相关方法
  private static roleRepository: Repository<Role> =
    AppDataSource.getRepository(Role);
  private static userRoleRepository: Repository<UserRole> =
    AppDataSource.getRepository(UserRole);
  private static permissionRepository: Repository<Permission> =
    AppDataSource.getRepository(Permission);

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

  /**
   * 为用户分配角色
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   * @returns 分配结果
   */
  static async assignRolesToUser(
    userId: string,
    roleIds: string[]
  ): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`ID为 '${userId}' 的用户不存在`);
    }

    // 验证所有角色ID是否有效
    for (const roleId of roleIds) {
      const role = await this.roleRepository.findOne({
        where: { id: roleId },
      });
      if (!role) {
        throw new Error(`ID为 '${roleId}' 的角色不存在`);
      }
    }

    // 使用事务处理角色分配
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建用户-角色关联
      for (const roleId of roleIds) {
        // 检查关联是否已存在
        const existingRelation = await this.userRoleRepository.findOne({
          where: { userId, roleId },
        });

        if (!existingRelation) {
          const userRole = new UserRole();
          userRole.userId = userId;
          userRole.roleId = roleId;
          await queryRunner.manager.save(userRole);
        }
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 移除用户的角色
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   * @returns 移除结果
   */
  static async removeRolesFromUser(
    userId: string,
    roleIds: string[]
  ): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`ID为 '${userId}' 的用户不存在`);
    }

    // 使用事务处理角色移除
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除指定的用户-角色关联
      for (const roleId of roleIds) {
        await queryRunner.manager.delete(UserRole, {
          userId,
          roleId,
        });
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取用户的所有角色
   * @param userId 用户ID
   * @returns 角色列表
   */
  static async getUserRoles(userId: string): Promise<Role[]> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`ID为 '${userId}' 的用户不存在`);
    }

    // 查询用户的所有角色
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ["role"],
    });

    // 提取角色对象
    return userRoles.map((ur) => ur.role);
  }

  /**
   * 获取用户的所有权限（包括通过角色继承的权限）
   * @param userId 用户ID
   * @returns 权限列表
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`ID为 '${userId}' 的用户不存在`);
    }

    // 获取用户的所有角色ID
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });
    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return []; // 用户没有角色，返回空权限列表
    }

    // 查询这些角色关联的所有权限
    const query = `
      SELECT DISTINCT p.*
      FROM permission p
      JOIN role_permission rp ON p.id = rp.permission_id
      WHERE rp.role_id IN (${roleIds.map(() => "?").join(", ")})
    `;

    const permissions = await this.permissionRepository.query(query, roleIds);
    return permissions;
  }

  /**
   * 检查用户是否拥有特定权限
   * @param userId 用户ID
   * @param permissionName 权限名称
   * @returns 如果用户拥有该权限返回true，否则返回false
   */
  static async hasPermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`ID为 '${userId}' 的用户不存在`);
    }

    // 获取用户的所有角色ID
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });
    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return false; // 用户没有角色，没有权限
    }

    // 查询这些角色是否包含指定的权限
    const query = `
      SELECT COUNT(*) as count
      FROM permission p
      JOIN role_permission rp ON p.id = rp.permission_id
      WHERE rp.role_id IN (${roleIds.map(() => "?").join(", ")}) AND p.name = ?
    `;

    const result = await this.permissionRepository.query(query, [
      ...roleIds,
      permissionName,
    ]);

    return result[0].count > 0;
  }
}
