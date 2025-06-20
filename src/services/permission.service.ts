import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Permission } from "../entities/permission.entity";
import { RolePermission } from "../entities/role-permission.entity";

export class PermissionService {
  private static permissionRepository: Repository<Permission> =
    AppDataSource.getRepository(Permission);
  private static rolePermissionRepository: Repository<RolePermission> =
    AppDataSource.getRepository(RolePermission);

  /**
   * 创建新权限
   * @param name 权限名称
   * @param description 权限描述
   * @param resource 资源
   * @param action 操作
   * @returns 创建的权限对象
   */
  static async createPermission(
    name: string,
    description: string,
    resource: string,
    action: string
  ): Promise<Permission> {
    // 检查resource+action唯一性
    const existingPermission = await this.findPermissionByResourceAction(resource, action);
    if (existingPermission) {
      throw new Error(`权限 resource='${resource}' action='${action}' 已存在`);
    }
    // 检查权限名称是否已存在
    const existingName = await this.findPermissionByName(name);
    if (existingName) {
      throw new Error(`权限名称 '${name}' 已存在`);
    }
    const permission = new Permission();
    permission.name = name;
    permission.description = description;
    permission.resource = resource;
    permission.action = action;
    return this.permissionRepository.save(permission);
  }

  /**
   * 通过ID查找权限
   * @param id 权限ID
   * @returns 权限对象或undefined
   */
  static async findPermissionById(id: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { id } });
  }

  /**
   * 通过名称查找权限
   * @param name 权限名称
   * @returns 权限对象或undefined
   */
  static async findPermissionByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { name } });
  }

  /**
   * 通过resource和action查找权限
   * @param resource 资源
   * @param action 操作
   * @returns 权限对象或undefined
   */
  static async findPermissionByResourceAction(resource: string, action: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { resource, action } });
  }

  /**
   * 获取所有权限
   * @returns 权限列表
   */
  static async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  /**
   * 更新权限信息
   * @param id 权限ID
   * @param data 要更新的权限数据
   * @returns 更新后的权限对象
   */
  static async updatePermission(
    id: string,
    data: Partial<Permission>
  ): Promise<Permission> {
    const permission = await this.findPermissionById(id);
    if (!permission) {
      throw new Error(`ID为 '${id}' 的权限不存在`);
    }
    // 如果要更新resource/action，检查唯一性
    if ((data.resource && data.resource !== permission.resource) || (data.action && data.action !== permission.action)) {
      const existing = await this.findPermissionByResourceAction(data.resource || permission.resource, data.action || permission.action);
      if (existing && existing.id !== id) {
        throw new Error(`权限 resource='${data.resource || permission.resource}' action='${data.action || permission.action}' 已存在`);
      }
    }
    // 如果要更新名称，检查新名称是否已存在
    if (data.name && data.name !== permission.name) {
      const existingName = await this.findPermissionByName(data.name);
      if (existingName) {
        throw new Error(`权限名称 '${data.name}' 已存在`);
      }
    }
    Object.assign(permission, data);
    return this.permissionRepository.save(permission);
  }

  /**
   * 删除权限
   * @param id 权限ID
   * @returns 删除操作结果
   */
  static async deletePermission(id: string): Promise<boolean> {
    const permission = await this.findPermissionById(id);
    if (!permission) {
      throw new Error(`ID为 '${id}' 的权限不存在`);
    }

    // 使用事务删除权限及其关联的角色关系
    const queryRunner =
      this.permissionRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除权限与角色的关联关系
      await queryRunner.manager.delete(RolePermission, { permissionId: id });

      // 删除权限
      await queryRunner.manager.delete(Permission, id);

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
   * 检查权限是否被任何角色使用
   * @param id 权限ID
   * @returns 如果权限被使用返回true，否则返回false
   */
  static async isPermissionInUse(id: string): Promise<boolean> {
    const count = await this.rolePermissionRepository.count({
      where: { permissionId: id },
    });
    return count > 0;
  }

  /**
   * 批量创建权限
   * @param permissions 权限对象数组，每个对象包含name, description, resource, action
   * @returns 创建的权限对象数组
   */
  static async createBulkPermissions(
    permissions: { name: string; description: string; resource: string; action: string }[]
  ): Promise<Permission[]> {
    const createdPermissions: Permission[] = [];
    const queryRunner = this.permissionRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const permData of permissions) {
        // 检查resource+action唯一性
        const existing = await queryRunner.manager.findOne(Permission, {
          where: { resource: permData.resource, action: permData.action },
        });
        if (existing) {
          continue;
        }
        // 检查权限名称是否已存在
        const existingName = await queryRunner.manager.findOne(Permission, {
          where: { name: permData.name },
        });
        if (existingName) {
          continue;
        }
        const permission = new Permission();
        permission.name = permData.name;
        permission.description = permData.description;
        permission.resource = permData.resource;
        permission.action = permData.action;
        const savedPermission = await queryRunner.manager.save(permission);
        createdPermissions.push(savedPermission);
      }
      await queryRunner.commitTransaction();
      return createdPermissions;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
