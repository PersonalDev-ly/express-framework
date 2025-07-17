import { In, MoreThan, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import redisClient from '../config/redisConfig';
import { Permission, RefreshToken, Role, User, UserRole } from '../entities';
import { UserRegisterDTO } from '../models/user.model';
import { HashPassword } from '../utils/hash-password-bcrypt';
import { logger } from '../utils/logger';

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
      throw new Error('邮箱已被注册');
    }

    // 创建新用户
    const now = new Date();
    const user = this.userRepository.create({
      email: userData.email,
      username: userData.username,
      password: await HashPassword.hashPassword(userData.password),
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
   * 保存用户的刷新令牌
   * @param userId 用户ID
   * @param refreshToken 刷新令牌
   */
  static async saveRefreshToken(
    userId: string,
    refreshToken: string,
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
    refreshToken: string,
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
    roleIds: string[],
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
    roleIds: string[],
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
      relations: ['role'],
    });

    // 提取角色对象
    return userRoles.map((ur) => ur.role);
  }

  /**
   * 获取用户的所有权限（包括通过角色继承的权限），带缓存
   * @param userId 用户ID
   * @returns 权限列表
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const cacheKey = `user:permissions:${userId}`;

    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`ID为 '${userId}' 的用户不存在`);
    }

    // 1. 查询缓存
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        console.warn(`缓存解析失败: ${err}`);
      }
    }

    // 2. 查询数据库
    const query = `
      SELECT DISTINCT
          P.name,
          P.resource,
          P.action
      FROM
          "user" U
      JOIN
          user_roles U2 ON U.user_id = U2.user_id
      JOIN 
          role_permissions R ON R.role_id = U2.role_id
      JOIN
          permissions P ON P.permission_id = R.permission_id
      WHERE
          U.user_id = $1;
  `;

    const permissions = await this.permissionRepository.query(query, [userId]);

    // 3. 写入缓存（缓存时间：1小时）
    await redisClient.setex(cacheKey, 3600, JSON.stringify(permissions));

    return permissions;
  }

  /**
   * 清理用户权限缓存
   * @param userId 用户ID
   */
  static async clearUserPermissionsCache(userId: string) {
    const cacheKey = `user:permissions:${userId}`;
    await redisClient.del(cacheKey);
  }

  /**
   * 检查用户是否拥有特定权限（支持resource+action或name）
   * @param userId 用户ID
   * @param opts 权限校验参数
   * @returns 如果用户拥有该权限返回true，否则返回false
   */
  static async hasPermission(
    userId: string,
    opts: { resource?: string; action?: string; name?: string },
  ): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(`ID为 '${userId}' 的用户不存在`);
    }
    // 获取用户的所有角色ID
    const userRoles = await this.userRoleRepository.find({ where: { userId } });
    const roleIds = userRoles.map((ur) => ur.roleId);
    if (roleIds.length === 0) {
      return false;
    }
    // 优先resource+action校验
    if (opts.resource && opts.action) {
      const query = `
        SELECT COUNT(*) as count
            FROM permissions p
        JOIN role_permissions rp ON p.permission_id = rp.permission_id
            WHERE rp.role_id IN (${roleIds
              .map((_, i) => `$${i + 1}`)
              .join(', ')})
            AND p.resource = $${roleIds.length + 1}
            AND p.action = $${roleIds.length + 2}
      `;
      const result = await this.permissionRepository.query(query, [
        ...roleIds,
        opts.resource,
        opts.action,
      ]);
      return result[0].count > 0;
    }
    // 兼容name校验
    if (opts.name) {
      const query = `
        SELECT COUNT(*) as count
            FROM permissions p
        JOIN role_permissions rp ON p.permission_id = rp.permission_id
            WHERE rp.role_id IN (${roleIds
              .map((_, i) => `$${i + 1}`)
              .join(', ')}) AND p.name = $${roleIds.length + 1}
      `;
      const result = await this.permissionRepository.query(query, [
        ...roleIds,
        opts.name,
      ]);
      return result[0].count > 0;
    }
    return false;
  }

  /**
   * 检查用户是否拥有任一权限
   * @param userId 用户ID
   * @param permissions 权限参数数组
   * @returns 只要有一个权限满足即返回true
   */
  static async hasAnyPermission(
    userId: string,
    permissions: { resource?: string; action?: string; name?: string }[],
  ): Promise<boolean> {
    for (const perm of permissions) {
      if (await this.hasPermission(userId, perm)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查用户是否拥有全部权限
   * @param userId 用户ID
   * @param permissions 权限参数数组
   * @returns 只有全部权限都满足才返回true
   */
  static async hasAllPermissions(
    userId: string,
    permissions: { resource?: string; action?: string; name?: string }[],
  ): Promise<boolean> {
    for (const perm of permissions) {
      if (!(await this.hasPermission(userId, perm))) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取所有用户
   * @returns 用户列表
   */
  static async getAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * 根据ID获取用户
   * @param id 用户ID
   * @returns 用户信息
   */
  static async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * 修改用户信息
   * @param data 用户信息
   * @returns 更新后的用户信息
   */
  static async updateUserById(data: Partial<User>): Promise<User> {
    return await this.userRepository.save(data);
  }

  /**
   * 删除用户
   * @param id 用户ID
   */
  static async deleteUserById(id: string): Promise<void> {
    // 使用事务确保数据一致性
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 先删除用户角色关联
      await queryRunner.manager.delete(UserRole, { userId: id });
      // 删除用户的刷新令牌
      await queryRunner.manager.delete(RefreshToken, { userId: id });
      // 最后删除用户
      await queryRunner.manager.delete(User, { id });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 批量删除用户
   * @param ids 用户ID列表
   */
  static async deleteUsers(ids: string[]): Promise<void> {
    // 使用事务确保数据一致性
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 先删除用户角色关联
      await queryRunner.manager.delete(UserRole, { userId: In(ids) });
      // 删除用户的刷新令牌
      await queryRunner.manager.delete(RefreshToken, { userId: In(ids) });
      // 最后删除用户
      await queryRunner.manager.delete(User, { id: In(ids) });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
