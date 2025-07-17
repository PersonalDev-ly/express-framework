import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? 'your-secret-key';
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN ??
  '24h') as SignOptions['expiresIn'];
const JWT_REFRESH_SECRET: Secret =
  process.env.JWT_REFRESH_SECRET ?? 'your-refresh-secret-key';
const JWT_REFRESH_EXPIRES_IN: SignOptions['expiresIn'] = (process.env
  .JWT_REFRESH_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

export interface AppJwtPayload {
  userId: string;
  email: string;
  [key: string]: any;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JwtUtil {
  /**
   * 生成访问令牌
   * @param payload 要加密的数据
   * @returns JWT token字符串
   */
  static generateAccessToken(payload: AppJwtPayload): string {
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  /**
   * 生成刷新令牌
   * @param payload 要加密的数据
   * @returns 刷新令牌字符串
   */
  static generateRefreshToken(payload: AppJwtPayload): string {
    const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN };
    return jwt.sign(payload, JWT_REFRESH_SECRET, options);
  }

  /**
   * 生成令牌对（访问令牌和刷新令牌）
   * @param payload 要加密的数据
   * @returns 令牌对象
   */
  static generateTokenPair(payload: AppJwtPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * 验证访问令牌
   * @param token JWT token字符串
   * @returns 解密后的数据
   */
  static verifyAccessToken(token: string): AppJwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as AppJwtPayload;
    } catch (error) {
      throw new Error('Invalid access token: ' + error);
    }
  }

  /**
   * 验证刷新令牌
   * @param token 刷新令牌字符串
   * @returns 解密后的数据
   */
  static verifyRefreshToken(token: string): AppJwtPayload {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as AppJwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token: ' + error);
    }
  }

  /**
   * 从请求头中提取token
   * @param authHeader Authorization header
   * @returns token字符串
   */
  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }
    return authHeader.split(' ')[1];
  }

  /**
   * 生成JWT token (兼容旧版本)
   * @param payload 要加密的数据
   * @returns JWT token字符串
   * @deprecated 使用 generateAccessToken 替代
   */
  static generateToken(payload: AppJwtPayload): string {
    return this.generateAccessToken(payload);
  }

  /**
   * 验证JWT token (兼容旧版本)
   * @param token JWT token字符串
   * @returns 解密后的数据
   * @deprecated 使用 verifyAccessToken 替代
   */
  static verifyToken(token: string): AppJwtPayload {
    return this.verifyAccessToken(token);
  }
}
