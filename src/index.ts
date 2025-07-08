import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { initializeDatabase } from "./config/database";
import { AuthController } from "./controllers/auth.controller";
import { PermissionController } from "./controllers/permission.controller";
import { RoleController } from "./controllers/role.controller";
import { UserController } from "./controllers/user.controller";
import {
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
} from "./middleware/error-handler.middleware";
import { logger, LogLevel } from "./utils/logger";
import { registerControllers } from "./utils/route-registry";

dotenv.config();

// 配置日志工具
logger.configure({
  // 控制台日志级别
  consoleLevel:
    process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  // 文件日志级别
  fileLevel: LogLevel.INFO,
  logFilePath: path.join(__dirname, "../logs/app.log"),
  includeTimestamp: true,
  includeLogLevel: true,
});

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 注册控制器
registerControllers(app, [
  AuthController,
  PermissionController,
  RoleController,
  UserController,
]);

// 404处理中间件（必须在所有路由之后注册）
app.use(notFoundHandler);

// 错误处理中间件（必须在所有中间件之后注册）
app.use(errorHandler);

// 设置全局未捕获异常处理
setupGlobalErrorHandlers();

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库连接
    await initializeDatabase();
    logger.info("数据库连接已初始化");

    app.listen(PORT, () => {
      logger.info(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error("服务器启动失败:", error);
    process.exit(1);
  }
};

startServer();
