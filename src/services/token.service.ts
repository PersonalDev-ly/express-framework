import { AppDataSource } from "../config/database";
import redisClient from "../config/redisConfig";
import { RefreshToken } from "../entities";
import { logger } from "../utils/logger";

/**
 * 刷新令牌服务
 * 管理刷新令牌的创建、验证和撤销
 */
export class TokenService {
  private static readonly KEY_PREFIX = "refresh:token:";
  private static readonly DEFAULT_TTL =
    process.env.REDIS_TTL ?? 7 * 24 * 60 * 60; // 7天（秒）

  /**
   * 保存刷新令牌
   * @param userId 用户ID
   * @param token 刷新令牌
   */
  static async saveRefreshToken(userId: string, token: string): Promise<void> {
    try {
      // 存储到Redis，使用用户ID作为键
      await redisClient.set(
        `${this.KEY_PREFIX}${userId}`,
        token,
        "EX",
        this.DEFAULT_TTL
      );

      logger.debug(`刷新令牌已保存到Redis，用户ID: ${userId}`);

      // 同时保存到数据库作为备份
      await this.fallbackSaveRefreshToken(userId, token);
    } catch (error) {
      logger.error("保存刷新令牌到Redis时出错", { error, userId });

      // 降级到仅数据库存储
      await this.fallbackSaveRefreshToken(userId, token);
    }
  }

  /**
   * 验证刷新令牌
   * @param userId 用户ID
   * @param token 刷新令牌
   * @returns 如果令牌有效返回true，否则返回false
   */
  static async validateRefreshToken(
    userId: string,
    token: string
  ): Promise<boolean> {
    try {
      // 从Redis获取存储的令牌
      const storedToken = await redisClient.get(`${this.KEY_PREFIX}${userId}`);

      if (!storedToken) {
        // Redis中不存在，尝试从数据库验证
        return this.fallbackValidateRefreshToken(userId, token);
      }

      return storedToken === token;
    } catch (error) {
      logger.error("验证刷新令牌时Redis错误", { error, userId });

      // 降级到数据库验证
      return this.fallbackValidateRefreshToken(userId, token);
    }
  }

  /**
   * 删除用户的刷新令牌
   * @param userId 用户ID
   */
  static async removeRefreshToken(userId: string): Promise<void> {
    try {
      // 从Redis删除令牌
      await redisClient.del(`${this.KEY_PREFIX}${userId}`);
      logger.debug(`已从Redis删除刷新令牌，用户ID: ${userId}`);

      // 同时从数据库删除
      await this.fallbackRemoveRefreshToken(userId);
    } catch (error) {
      logger.error("删除刷新令牌时Redis错误", { error, userId });

      // 降级到仅数据库操作
      await this.fallbackRemoveRefreshToken(userId);
    }
  }

  /**
   * 数据库备份：保存刷新令牌
   */
  private static async fallbackSaveRefreshToken(
    userId: string,
    token: string
  ): Promise<void> {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

    // 先删除该用户的旧令牌
    await refreshTokenRepo.delete({ userId });

    // 创建新的刷新令牌记录
    const refreshToken = new RefreshToken();
    refreshToken.userId = userId;
    refreshToken.token = token;
    refreshToken.expiresAt = new Date(
      Date.now() + Number(this.DEFAULT_TTL) * 1000
    );

    await refreshTokenRepo.save(refreshToken);
    logger.warn("使用数据库备份存储刷新令牌", { userId });
  }

  /**
   * 数据库备份：验证刷新令牌
   */
  private static async fallbackValidateRefreshToken(
    userId: string,
    token: string
  ): Promise<boolean> {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    const refreshToken = await refreshTokenRepo.findOne({
      where: { userId, token },
    });

    if (!refreshToken) {
      return false;
    }

    // 检查令牌是否过期
    if (refreshToken.expiresAt < new Date()) {
      await refreshTokenRepo.remove(refreshToken);
      return false;
    }

    return true;
  }

  /**
   * 数据库备份：删除刷新令牌
   */
  private static async fallbackRemoveRefreshToken(
    userId: string
  ): Promise<void> {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    await refreshTokenRepo.delete({ userId });
  }
}
