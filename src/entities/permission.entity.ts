import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RolePermission } from "./role-permission.entity";

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission
  )
  rolePermissions: RolePermission[];
}
