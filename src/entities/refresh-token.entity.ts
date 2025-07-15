import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class RefreshToken {
  @PrimaryColumn({ name: "user_id", comment: "用户ID" })
  userId: string;

  @Column({ comment: "刷新token" })
  token: string;

  @Column({ comment: "过期时间" })
  expiresAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;
}
