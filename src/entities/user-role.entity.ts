import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Role } from "./role.entity";
import { User } from "./user.entity";

@Entity("user_roles")
export class UserRole {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ name: "role_id" })
  roleId: string;

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: "role_id" })
  role: Role;
}
