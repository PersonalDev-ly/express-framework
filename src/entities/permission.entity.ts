import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid', { name: 'permission_id', comment: '权限ID' })
  id: string;

  @Column({ unique: true, comment: '权限名称' })
  name: string;

  @Column({ comment: '资源' })
  resource: string;

  @Column({ comment: '操作' })
  action: string;

  @Column({ nullable: true, comment: '描述' })
  description: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];
}
