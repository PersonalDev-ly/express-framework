import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("sys_menu")
export class MenuEntity {
  @PrimaryGeneratedColumn("uuid", { name: "menu_id", comment: "菜单ID" })
  id: string;

  @Column({ name: "parent_id", default: 0, comment: "父菜单ID（0为根）" })
  parentId: number;

  @Column({ length: 50, comment: "菜单名称" })
  name: string;

  @Column({ length: 200, default: "", comment: "路由路径" })
  path: string;

  @Column({ length: 200, default: "", comment: "组件路径" })
  component: string;

  @Column({ length: 50, default: "", comment: "图标类名" })
  icon: string;

  @Column({ default: 0, comment: "排序权重" })
  sort: number;

  @Column({ default: 1, comment: "是否显示（0隐藏，1显示）" })
  visible: number;

  @Column({ length: 200, default: "", comment: "重定向路径" })
  redirect: string;

  @Column({
    default: 1,
    comment: "类型（1菜单，2按钮，3外链）",
  })
  type: number;

  @Column({ length: 100, default: "", comment: "权限标识（如user:add）" })
  perms: string;

  @Column({ default: 1, comment: "状态（0停用，1启用）" })
  status: number;

  @Column({
    name: "create_time",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "创建时间",
  })
  createTime: Date;

  @Column({
    name: "update_time",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
    comment: "更新时间",
  })
  updateTime: Date;
}
