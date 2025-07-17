import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from './user-role.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id', comment: '用户ID' })
  id: string;

  @Column({ nullable: true, comment: '用户名' })
  username: string;

  @Column({ unique: true, comment: '邮箱' })
  email: string;

  @Column({ comment: '密码' })
  password: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: '是否为超级管理员',
  })
  isSuperAdmin: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @CreateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];
}
