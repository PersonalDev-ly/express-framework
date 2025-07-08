/**
 * 用户模型定义
 */

// 用户基本信息接口
export interface User {
  id: string;
  email: string;
  username: string;
  password: string; // 存储哈希后的密码
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 用户注册请求数据接口
export interface UserRegisterDTO {
  email: string;
  password: string;
}

// 用户登录请求数据接口
export interface UserLoginDTO {
  email: string;
  password: string;
}

// 用户认证令牌响应接口
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// 用户公开信息接口（不包含敏感数据）
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 将用户对象转换为公开信息
export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    isSuperAdmin: user.isSuperAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
