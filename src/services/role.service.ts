import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Permission, Role, RolePermission, UserRole } from '../entities';
import { UserService } from './user.service';

export class RoleService {
  private static roleRepository: Repository<Role> =
    AppDataSource.getRepository(Role);
  private static rolePermissionRepository: Repository<RolePermission> =
    AppDataSource.getRepository(RolePermission);
  private static userRoleRepository: Repository<UserRole> =
    AppDataSource.getRepository(UserRole);

  /**
   * 创建新角色
   * @param name 角色名称
   * @param description 角色描述
   * @returns 创建的角色对象
   */
  static async createRole(name: string, description: string): Promise<Role> {
    // 检查角色名称是否已存在
    const existingRole = await this.findRoleByName(name);
    if (existingRole) {
      throw new Error(`角色名称 '${name}' 已存在`);
    }

    const role = new Role();
    role.name = name;
    role.description = description;

    return this.roleRepository.save(role);
  }

  /**
   * 通过ID查找角色
   * @param id 角色ID
   * @returns 角色对象或null
   */
  static async findRoleById(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  /**
   * 通过名称查找角色
   * @param name 角色名称
   * @returns 角色对象或null
   */
  static async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  /**
   * 获取所有角色
   * @returns 角色列表
   */
  static async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  /**
   * 更新角色信息
   * @param id 角色ID
   * @param data 要更新的角色数据
   * @returns 更新后的角色对象
   */
  static async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    const role = await this.findRoleById(id);
    if (!role) {
      throw new Error(`ID为 '${id}' 的角色不存在`);
    }

    // 如果要更新名称，检查新名称是否已存在
    if (data.name && data.name !== role.name) {
      const existingRole = await this.findRoleByName(data.name);
      if (existingRole) {
        throw new Error(`角色名称 '${data.name}' 已存在`);
      }
    }

    // 更新角色属性
    Object.assign(role, data);

    return this.roleRepository.save(role);
  }

  /**
   * 删除角色
   * @param id 角色ID
   * @returns 删除操作结果
   */
  static async deleteRole(id: string): Promise<boolean> {
    const role = await this.findRoleById(id);
    if (!role) {
      throw new Error(`ID为 '${id}' 的角色不存在`);
    }

    // 使用事务删除角色及其关联关系
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除角色与用户的关联关系
      await queryRunner.manager.delete(UserRole, { roleId: id });

      // 删除角色与权限的关联关系
      await queryRunner.manager.delete(RolePermission, { roleId: id });

      // 删除角色
      await queryRunner.manager.delete(Role, id);

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
   * 批量删除角色
   * @param ids 角色ID数组
   * @returns 删除结果
   */
  static async deleteRoles(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      await this.deleteRole(id);
    }
    return true;
  }

  /**
   * 为角色分配权限
   * @param roleId 角色ID
   * @param permissionIds 权限ID数组
   * @returns 分配结果
   */
  static async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<boolean> {
    const role = await this.findRoleById(roleId);
    if (!role) {
      throw new Error(`ID为 '${roleId}' 的角色不存在`);
    }

    // 使用事务处理权限分配
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建角色-权限关联
      for (const permissionId of permissionIds) {
        // 检查关联是否已存在
        const existingRelation = await this.rolePermissionRepository.findOne({
          where: { roleId, permissionId },
        });

        if (!existingRelation) {
          const rolePermission = new RolePermission();
          rolePermission.roleId = roleId;
          rolePermission.permissionId = permissionId;
          await queryRunner.manager.save(rolePermission);
        }
      }

      await queryRunner.commitTransaction();
      // 权限变更后清理所有拥有该角色的用户的权限缓存
      const userRoles = await this.userRoleRepository.find({
        where: { roleId },
      });
      const userIds = userRoles.map((ur) => ur.userId);
      for (const userId of userIds) {
        await UserService.clearUserPermissionsCache(userId);
      }
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 移除角色的权限
   * @param roleId 角色ID
   * @param permissionIds 权限ID数组
   * @returns 移除结果
   */
  static async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<boolean> {
    const role = await this.findRoleById(roleId);
    if (!role) {
      throw new Error(`ID为 '${roleId}' 的角色不存在`);
    }

    // 使用事务处理权限移除
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除指定的角色-权限关联
      for (const permissionId of permissionIds) {
        await queryRunner.manager.delete(RolePermission, {
          roleId,
          permissionId,
        });
      }

      await queryRunner.commitTransaction();
      // 权限变更后清理所有拥有该角色的用户的权限缓存
      const userRoles = await this.userRoleRepository.find({
        where: { roleId },
      });
      const userIds = userRoles.map((ur) => ur.userId);
      for (const userId of userIds) {
        await UserService.clearUserPermissionsCache(userId);
      }
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取角色的所有权限
   * @param roleId 角色ID
   * @returns 权限列表
   */
  static async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.findRoleById(roleId);
    if (!role) {
      throw new Error(`ID为 '${roleId}' 的角色不存在`);
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * 检查角色是否被任何用户使用
   * @param id 角色ID
   * @returns 如果角色被使用返回true，否则返回false
   */
  static async isRoleInUse(id: string): Promise<boolean> {
    const count = await this.userRoleRepository.count({
      where: { roleId: id },
    });
    return count > 0;
  }
}
