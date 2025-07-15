import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RolePermission } from "./role-permission.entity";
import { UserRole } from "./user-role.entity";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid", { name: "role_id", comment: "角色ID" })
  id: string;

  @Column({ unique: true, comment: "角色名称" })
  name: string;

  @Column({ nullable: true, comment: "描述" })
  description: string;

  @CreateDateColumn({ name: "created_at", comment: "创建时间" })
  createdAt: Date;

  @CreateDateColumn({ name: "updated_at", comment: "更新时间" })
  updatedAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}
