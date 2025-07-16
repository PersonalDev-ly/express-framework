import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("menu")
export class MenuEntity {
  @PrimaryGeneratedColumn("uuid", { name: "menu_id", comment: "菜单ID" })
  id: string;

  @Column({ name: "parent_id", default: 0, comment: "父菜单ID（0为根）" })
  parentId: number;

  @Column({ comment: "菜单名称" })
  name: string;

  @Column({ default: "", comment: "路由路径" })
  path: string;

  @Column({ default: "", comment: "组件路径" })
  component: string;

  @Column({ default: "", comment: "图标类名" })
  icon: string;

  @Column({ default: 0, comment: "排序权重" })
  sort: number;

  @Column({ default: true, comment: "是否显示（false 隐藏，true 显示）" })
  visible: boolean;

  @Column({ default: "", comment: "重定向路径" })
  redirect: string;

  @Column({
    default: 1,
    comment: "类型（1菜单，2按钮，3外链）",
  })
  type: number;

  @Column({ default: "", comment: "权限标识（如user:add）" })
  perms: string;

  @Column({ default: 1, comment: "状态（0停用，1启用）" })
  status: number;

  @CreateDateColumn({ name: "created_at", comment: "创建时间" })
  createdAt: Date;

  @CreateDateColumn({ name: "updated_at", comment: "更新时间" })
  updatedAt: Date;
}
