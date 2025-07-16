# TypeScript Express Framework

一个基于 TypeScript 装饰器实现的 Express.js 框架，提供了优雅的路由注册、中间件管理、权限控制和数据库集成方案。

## 核心特性

- **装饰器驱动开发**：使用装饰器进行路由注册和中间件配置
- **完整的认证系统**：JWT 认证、刷新令牌、令牌黑名单
- **RBAC 权限控制**：基于角色的访问控制系统
- **数据库集成**：TypeORM + PostgreSQL
- **Redis 支持**：缓存、令牌黑名单
- **日志系统**：多级别日志、文件轮转
- **环境配置**：基于 dotenv 的环境变量管理
- **错误处理**：全局错误捕获和处理
- **类型安全**：完全基于 TypeScript

## 技术栈

- **核心**：TypeScript + Express.js
- **数据库**：PostgreSQL + TypeORM
- **缓存**：Redis
- **认证**：JWT (jsonwebtoken)
- **工具库**：reflect-metadata, dotenv
- **开发工具**：ts-node-dev, rimraf

## 项目结构

```
src/
├── config/             # 配置文件
│   ├── database.ts               # 数据库配置
│   └── redisConfig.ts            # Redis配置
├── controllers/                  # 控制器目录
│   ├── auth.controller.ts        # 认证控制器
│   ├── user.controller.ts        # 用户控制器
│   ├── role.controller.ts        # 角色控制器
│   └── permission.controller.ts  # 权限控制器
├── decorators/         # 装饰器实现
│   ├── auth.decorator.ts         # 认证装饰器
│   ├── controller.decorator.ts   # 控制器装饰器
│   ├── handlers.decorator.ts     # 路由处理装饰器
│   ├── middleware.decorator.ts   # 中间件装饰器
│   ├── params.decorator.ts       # 参数装饰器
│   ├── rbac.decorator.ts         # 权限装饰器
│   └── index.ts                  # 装饰器导出
├── entities/           # 数据库实体
│   ├── index.ts                  # 实体导出
│   ├── user.entity.ts            # 用户实体
│   ├── role.entity.ts            # 角色实体
│   ├── permission.entity.ts      # 权限实体
│   ├── sys-menu.entity.ts        # 菜单实体
│   ├── user-role.entity.ts       # 用户-角色关系
│   ├── role-permission.entity.ts # 角色-权限关系
│   └── refresh-token.entity.ts   # 刷新令牌实体
├── middleware/         # 中间件
│   ├── auth.middleware.ts        # 认证中间件
│   ├── rbac.middleware.ts        # 权限中间件
│   └── error-handler.middleware.ts # 错误处理中间件
├── models/             # 数据模型/DTO
│   └── user.model.ts             # 用户模型
├── services/           # 业务逻辑服务
│   ├── user.service.ts           # 用户服务
│   ├── token.service.ts          # 令牌服务
│   ├── permission.service.ts     # 权限服务
│   └── role.service.ts           # 角色服务
├── types/              # 类型定义
│   ├── index.ts
│   └── errors.ts
├── utils/              # 工具函数
│   ├── logger.ts                 # 日志工具
│   ├── jwt.util.ts               # JWT工具
│   ├── hash-password-bcrypt.ts   # 密码哈希工具
│   ├── route-registry.ts         # 路由注册工具
│   └── token-blacklist.util.ts   # 令牌黑名单工具
└── index.ts            # 应用入口
```

## 安装与运行

### 前置条件

- Node.js 14+
- PostgreSQL
- Redis (可选，用于令牌黑名单和缓存)

### 安装步骤

```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
npm install

# 编辑 .env 文件，设置数据库连接信息和JWT密钥

# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 运行生产环境
npm start
```

## 核心功能

### 1. 认证系统

框架提供完整的 JWT 认证系统，包括：

- 用户注册
- 用户登录
- 令牌刷新
- 用户登出
- 令牌黑名单

所有路由默认需要认证，可以通过 `@AllowAnonymous()` 装饰器取消认证限制。

```typescript
// 用户登录示例
@AllowAnonymous()
@Post("/login")
async login(req: Request, res: Response) {
  // 登录逻辑
}
```

### 2. RBAC 权限控制

基于角色的访问控制系统，支持：

- 角色管理
- 权限管理
- 用户-角色分配
- 角色-权限分配

```typescript
// 权限控制示例
@RequirePermission({ resource: "user", action: "read" })
@Get("/")
async getAllUsers(req: Request, res: Response) {
  // 获取用户列表
}
```

### 3. 装饰器路由系统

使用装饰器定义路由和中间件：

```typescript
@Controller("/users")
export class UserController {
  @Get("/:id")
  async getUserById(req: Request, res: Response) {
    // 获取用户详情
  }

  @Post("/")
  async createUser(req: Request, res: Response) {
    // 创建用户
  }
}
```

### 4. 数据库集成

使用 TypeORM 进行数据库操作：

```typescript
// 数据库配置
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_DATABASE || "express_auth",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [User, RefreshToken, Permission, RolePermission, Role, UserRole],
  subscribers: [],
  migrations: [],
});
```

### 5. 日志系统

框架内置了一个功能强大的日志系统，支持多级别日志、控制台和文件输出、日志轮转等特性。

```typescript
// 日志配置
logger.configure({
  consoleLevel:
    process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  fileLevel: LogLevel.INFO,
  logFilePath: path.join(__dirname, "../logs/app.log"),
  includeTimestamp: true,
  includeLogLevel: true,
});

// 使用日志
logger.info("服务器已启动");
logger.error("发生错误", error);
```

## 环境变量配置

项目使用 dotenv 管理环境变量，主要配置项包括：

```
# 服务器配置
PORT=3001
NODE_ENV=development

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=1d

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=your_database

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_TTL=86400
```

## API 文档

详细的 API 文档请参考 `api_documentation` 目录。
将目录下的 `json` 文件导入 ApiFox 工具查看、测试。

## 开发指南

### 创建新控制器

1. 在 `src/controllers` 目录下创建新的控制器文件
2. 使用 `@Controller` 装饰器定义控制器
3. 使用 `@Get`, `@Post` 等装饰器定义路由
4. 在 `src/index.ts` 中注册控制器

### 添加新的实体

1. 在 `src/entities` 目录下创建新的实体文件
2. 使用 TypeORM 装饰器定义实体
3. 在 `src/config/database.ts` 中注册实体

### 实现权限控制

1. 在数据库中添加相应的权限记录
2. 使用 `@RequirePermission` 装饰器保护路由

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

2. 开发环境下数据库会自动同步结构，生产环境请使用迁移
