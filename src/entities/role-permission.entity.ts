import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Permission } from "./permission.entity";
import { Role } from "./role.entity";

@Entity("role_permissions")
export class RolePermission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "role_id" })
  roleId: string;

  @Column({ name: "permission_id" })
  permissionId: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions)
  @JoinColumn({ name: "role_id" })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions)
  @JoinColumn({ name: "permission_id" })
  permission: Permission;
}
