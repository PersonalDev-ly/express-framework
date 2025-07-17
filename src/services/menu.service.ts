import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { MenuEntity, RoleMenu } from '../entities';
import { MenuDTO, MenuTreeNode } from '../models/menu.model';

export class MenuService {
  private static menuRepository: Repository<MenuEntity> =
    AppDataSource.getRepository(MenuEntity);
  private static roleMenuRepository: Repository<RoleMenu> =
    AppDataSource.getRepository(RoleMenu);

  /**
   * 创建菜单
   * @param data 创建菜单数据
   * @returns 创建的菜单对象
   */
  static async createMenu(data: MenuDTO): Promise<MenuEntity> {
    const menu = this.menuRepository.create(data);
    return this.menuRepository.save(menu);
  }

  /**
   * 更新菜单
   * @param id 菜单ID
   * @param data 修改的菜单数据
   * @returns 修改的菜单对象
   */
  static async updateMenu(
    id: number,
    data: Partial<MenuDTO>,
  ): Promise<MenuEntity> {
    await this.menuRepository.update(id, data);
    return this.menuRepository.findOneByOrFail({ id });
  }

  /**
   * 删除菜单
   * @param id 菜单ID
   */
  static async deleteMenu(id: number): Promise<void> {
    await this.menuRepository.delete(id);
  }

  /**
   * 获取所有菜单
   * @returns 所有菜单数据
   */
  static async getAllMenus(): Promise<MenuEntity[]> {
    return this.menuRepository.find();
  }

  /**
   * 获取菜单树结构
   * @returns 树结构菜单数据
   */
  static async getMenuTree(): Promise<MenuTreeNode[]> {
    const menus = await this.menuRepository.find();
    return this.buildMenuTree(menus);
  }

  /**
   * 构建菜单树结构
   * @param menus 菜单数据
   * @param parentId 父级菜单ID
   * @returns 树结构菜单数据
   */
  static buildMenuTree(
    menus: MenuEntity[],
    parentId: number = 0,
  ): MenuTreeNode[] {
    return menus
      .filter((menu) => menu.parentId === parentId)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((menu) => ({
        ...menu,
        children: this.buildMenuTree(menus, menu.id),
      }));
  }

  /**
   * 为角色分配菜单
   * @param roleId 角色ID
   * @param menuIds 菜单ID列表
   */
  static async assignMenusToRole(
    roleId: string,
    menuIds: number[],
  ): Promise<void> {
    // 先删除原有分配
    await this.roleMenuRepository.delete({ roleId });
    // 新增分配
    const roleMenus = menuIds.map((menuId) => {
      const rm = new RoleMenu();
      rm.roleId = roleId;
      rm.menuId = menuId;
      return rm;
    });
    await this.roleMenuRepository.save(roleMenus);
  }

  /**
   * 获取角色菜单ID列表
   * @param roleId 角色ID
   * @returns 菜单ID列表
   */
  static async getRoleMenus(roleId: string): Promise<number[]> {
    const roleMenus = await this.roleMenuRepository.find({ where: { roleId } });
    return roleMenus.map((rm) => rm.menuId);
  }
}
