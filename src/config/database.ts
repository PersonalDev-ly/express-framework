import dotenv from "dotenv";
import { DataSource } from "typeorm";
import {
  MenuEntity,
  Permission,
  RefreshToken,
  Role,
  RoleMenu,
  RolePermission,
  User,
  UserRole,
} from "../entities";

// 加载环境变量
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "postgres",
  synchronize: process.env.NODE_ENV === "development", // 开发环境下自动同步数据库结构
  logging: process.env.NODE_ENV === "development",
  entities: [
    User,
    RefreshToken,
    Permission,
    RolePermission,
    Role,
    UserRole,
    MenuEntity,
    RoleMenu,
  ],
  subscribers: [],
  migrations: [],
});

// 初始化数据库连接
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
  } catch (error) {
    throw error;
  }
};
