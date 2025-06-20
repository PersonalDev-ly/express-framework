import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Permission } from "../entities/permission.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { Role } from "../entities/role.entity";

export class RoleService {
  private static roleRepository: Repository<Role> =
    AppDataSource.getRepository(Role);
  private static permissionRepository: Repository<Permission> =
    AppDataSource.getRepository(Permission);
  private static rolePermissionRepository: Repository<RolePermission> =
    AppDataSource.getRepository(RolePermission);

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

    return await this.roleRepository.save(role);
  }

  /**
   * 通过ID查找角色
   * @param id 角色ID
   * @returns 角色对象或undefined
   */
  static async findRoleById(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  /**
   * 通过名称查找角色
   * @param name 角色名称
   * @returns 角色对象或undefined
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

    // 使用事务删除角色及其关联的权限关系
    const queryRunner =
      this.roleRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除角色与权限的关联关系
      await queryRunner.manager.delete(RolePermission, { roleId: id });

      // 删除角色与用户的关联关系
      await queryRunner.manager.delete("user_roles", { roleId: id });

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
   * 为角色分配权限
   * @param roleId 角色ID
   * @param permissionIds 权限ID数组
   * @returns 分配结果
   */
  static async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<boolean> {
    const role = await this.findRoleById(roleId);
    if (!role) {
      throw new Error(`ID为 '${roleId}' 的角色不存在`);
    }

    // 验证所有权限ID是否有效
    for (const permissionId of permissionIds) {
      const permission = await this.permissionRepository.findOne({
        where: { id: permissionId },
      });
      if (!permission) {
        throw new Error(`ID为 '${permissionId}' 的权限不存在`);
      }
    }

    // 使用事务处理权限分配
    const queryRunner =
      this.roleRepository.manager.connection.createQueryRunner();
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
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 从角色中移除权限
   * @param roleId 角色ID
   * @param permissionIds 权限ID数组
   * @returns 移除结果
   */
  static async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[]
  ): Promise<boolean> {
    const role = await this.findRoleById(roleId);
    if (!role) {
      throw new Error(`ID为 '${roleId}' 的角色不存在`);
    }

    // 使用事务处理权限移除
    const queryRunner =
      this.roleRepository.manager.connection.createQueryRunner();
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

    // 查询角色的所有权限
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ["permission"],
    });

    // 提取权限对象
    return rolePermissions.map((rp) => rp.permission);
  }
}
