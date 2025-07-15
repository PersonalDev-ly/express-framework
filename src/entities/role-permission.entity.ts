import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Permission } from "./permission.entity";
import { Role } from "./role.entity";

@Entity("role_permissions")
export class RolePermission {
  @PrimaryColumn({ name: "role_id", comment: "角色ID" })
  roleId: string;

  @PrimaryColumn({ name: "permission_id", comment: "权限ID" })
  permissionId: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions)
  @JoinColumn({ name: "role_id" })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions)
  @JoinColumn({ name: "permission_id" })
  permission: Permission;
}
