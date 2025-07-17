import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MenuEntity } from './menu.entity';
import { Role } from './role.entity';

@Entity('role_menus')
export class RoleMenu {
  @PrimaryColumn({ name: 'role_id', type: 'uuid', comment: '角色ID' })
  roleId: string;

  @PrimaryColumn({ name: 'menu_id', type: 'int', comment: '菜单ID' })
  menuId: number;

  @ManyToOne(() => Role, (role) => role.roleMenus)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => MenuEntity, (menu) => menu.roleMenus)
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity;
}
