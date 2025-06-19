# TypeScript Express Decorator Framework

一个基于 TypeScript 装饰器实现的 Express.js 框架，提供了优雅的路由注册和中间件管理方式。

## 特性

- 使用装饰器进行路由注册
- 支持控制器级别的路由前缀
- 内置请求参数装饰器（@Body, @Query, @Param 等）
- 灵活的中间件管理
- 完全类型安全

## 技术栈

- TypeScript
- Express.js
- reflect-metadata

## 项目结构

```
src/
├── controllers/        # 控制器目录
│   └── user.controller.ts
├── decorators/        # 装饰器实现
│   ├── controller.decorator.ts
│   ├── handlers.decorator.ts
│   ├── middleware.decorator.ts
│   └── index.ts
├── types/            # 类型定义
│   └── index.ts
└── index.ts         # 应用入口
```

## 安装

```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
```

## 使用示例

### 1. 创建控制器

```typescript
import { Controller, Get, Post, Body, Query } from "../decorators";

@Controller("/users")
export class UserController {
  @Get("/")
  async getAllUsers(@Query("page") page: number) {
    return { users: [], page };
  }

  @Post("/")
  async createUser(@Body() userData: any) {
    return { message: "User created", data: userData };
  }
}
```

### 2. 使用中间件

```typescript
import { Controller, Get, Use } from "../decorators";
import { authMiddleware } from "../middlewares";

@Controller("/admin")
@Use(authMiddleware) // 控制器级别中间件
export class AdminController {
  @Get("/")
  @Use(logMiddleware) // 路由级别中间件
  async getAdminDashboard() {
    return { status: "ok" };
  }
}
```

### 3. 参数装饰器

```typescript
import { Controller, Get, Post, Body, Query, Param } from "../decorators";

@Controller("/posts")
export class PostController {
  @Get("/:id")
  async getPost(@Param("id") id: string, @Query("fields") fields?: string) {
    return { id, fields };
  }

  @Post("/")
  async createPost(
    @Body() postData: any,
    @Headers("authorization") token: string
  ) {
    return { message: "Post created", data: postData };
  }
}
```

## API 文档

### 控制器装饰器

- `@Controller(basePath: string)`: 定义控制器的基础路径

### 路由装饰器

- `@Get(path: string)`
- `@Post(path: string)`
- `@Put(path: string)`
- `@Delete(path: string)`
- `@Patch(path: string)`

### 参数装饰器

- `@Body()`: 获取请求体
- `@Query(name?: string)`: 获取查询参数
- `@Param(name?: string)`: 获取路由参数
- `@Headers(name?: string)`: 获取请求头
- `@Cookies(name?: string)`: 获取 Cookie

### 中间件装饰器

- `@Use(...middleware: Middleware[])`: 应用中间件

## 类型定义

```typescript
// 中间件类型
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

// 路由定义
type RouteDefinition = {
  path: string;
  method: string;
  methodName: string | symbol;
  middleware: Middleware[];
};

// 控制器定义
type ControllerDefinition = {
  basePath: string;
  routes: RouteDefinition[];
};
```

## 注意事项

1. 确保在 `tsconfig.json` 中启用装饰器支持：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

2. 需要安装 `reflect-metadata` 包并在应用入口导入：

```typescript
import "reflect-metadata";
```

## 日志系统

框架内置了一个功能强大的日志系统，支持多级别日志、控制台和文件输出、日志轮转等特性。

### 日志级别

```typescript
enum LogLevel {
  DEBUG = 0, // 调试信息
  INFO = 1, // 一般信息
  WARN = 2, // 警告信息
  ERROR = 3, // 错误信息
  NONE = 4, // 不记录日志
}
```

### 日志配置

```typescript
interface LoggerConfig {
  /** 控制台日志级别 */
  consoleLevel: LogLevel;
  /** 文件日志级别 */
  fileLevel: LogLevel;
  /** 日志文件路径 */
  logFilePath?: string;
  /** 是否在日志中包含时间戳 */
  includeTimestamp?: boolean;
  /** 是否在日志中包含日志级别 */
  includeLogLevel?: boolean;
}
```

### 使用示例

#### 基本用法

```typescript
import { logger, debug, info, warn, error } from "../utils/logger";

// 使用便捷函数
debug("这是一条调试日志");
info("这是一条信息日志");
warn("这是一条警告日志");
error("这是一条错误日志");

// 或者使用 logger 实例
logger.debug("这是一条调试日志");
logger.info("这是一条信息日志");
logger.warn("这是一条警告日志");
logger.error("这是一条错误日志");
```

#### 配置日志系统

```typescript
import { Logger, LogLevel } from "../utils/logger";

// 获取日志实例
const logger = Logger.getInstance();

// 配置日志系统
logger.configure({
  consoleLevel: LogLevel.DEBUG, // 控制台输出 DEBUG 及以上级别的日志
  fileLevel: LogLevel.INFO, // 文件输出 INFO 及以上级别的日志
  logFilePath: "./logs/app.log", // 日志文件路径
  includeTimestamp: true, // 包含时间戳
  includeLogLevel: true, // 包含日志级别
});
```

### 日志轮转

日志系统支持按日期自动轮转日志文件。例如，如果配置的日志文件路径为 `./logs/app.log`，实际生成的日志文件会是 `./logs/app-2023-05-20.log`，每天会自动创建新的日志文件。

### 在应用中集成

在应用入口文件中配置日志系统：

```typescript
import express from "express";
import { Logger, LogLevel } from "./utils/logger";

// 配置日志系统
const logger = Logger.getInstance();
logger.configure({
  consoleLevel:
    process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  fileLevel: LogLevel.INFO,
  logFilePath: "./logs/app.log",
});

// 创建 Express 应用
const app = express();

// ... 应用配置 ...

// 启动服务器
app.listen(3000, () => {
  logger.info("服务器已启动，监听端口 3000");
});
```

## 许可证

MIT

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -am 'Add some feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 提交 Pull Request
