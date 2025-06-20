import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { Permission } from "../entities/permission.entity";
import { RefreshToken } from "../entities/refresh-token.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { Role } from "../entities/role.entity";
import { UserRole } from "../entities/user-role.entity";
import { User } from "../entities/user.entity";

// 加载环境变量
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_DATABASE || "express_auth",
  synchronize: process.env.NODE_ENV === "development", // 开发环境下自动同步数据库结构
  logging: process.env.NODE_ENV === "development",
  entities: [User, RefreshToken, Permission, RolePermission, Role, UserRole],
  subscribers: [],
  migrations: [],
});

// 初始化数据库连接
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
