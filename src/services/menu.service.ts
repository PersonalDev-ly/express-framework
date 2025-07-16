import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { MenuEntity, RoleMenu } from "../entities";
import { MenuDTO, MenuTreeNode } from "../models/menu.model";

export class MenuService {
  private static menuRepository: Repository<MenuEntity> =
    AppDataSource.getRepository(MenuEntity);
  private static roleMenuRepository: Repository<RoleMenu> =
    AppDataSource.getRepository(RoleMenu);

  /** 创建菜单 */
  static async createMenu(data: MenuDTO): Promise<MenuEntity> {
    const menu = this.menuRepository.create(data);
    return this.menuRepository.save(menu);
  }

  /** 更新菜单 */
  static async updateMenu(
    id: number,
    data: Partial<MenuDTO>
  ): Promise<MenuEntity> {
    await this.menuRepository.update(id, data);
    return this.menuRepository.findOneByOrFail({ id });
  }

  /** 删除菜单 */
  static async deleteMenu(id: number): Promise<void> {
    await this.menuRepository.delete(id);
  }

  /** 获取所有菜单 */
  static async getAllMenus(): Promise<MenuEntity[]> {
    return this.menuRepository.find();
  }

  /** 获取菜单树结构 */
  static async getMenuTree(): Promise<MenuTreeNode[]> {
    const menus = await this.menuRepository.find();
    return this.buildMenuTree(menus);
  }

  /** 构建菜单树 */
  static buildMenuTree(
    menus: MenuEntity[],
    parentId: number = 0
  ): MenuTreeNode[] {
    return menus
      .filter((menu) => menu.parentId === parentId)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((menu) => ({
        ...menu,
        children: this.buildMenuTree(menus, menu.id),
      }));
  }

  /** 为角色分配菜单 */
  static async assignMenusToRole(
    roleId: string,
    menuIds: number[]
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

  /** 获取角色的所有菜单ID */
  static async getRoleMenus(roleId: string): Promise<number[]> {
    const roleMenus = await this.roleMenuRepository.find({ where: { roleId } });
    return roleMenus.map((rm) => rm.menuId);
  }
}
