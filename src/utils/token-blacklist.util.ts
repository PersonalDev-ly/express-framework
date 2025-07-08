import redisClient from "../config/redisConfig";
import { logger } from "./logger";

/**
 * 令牌黑名单工具类
 * 使用Redis存储已吊销的JWT令牌，同时保留内存存储作为备份
 */
export class TokenBlacklistUtil {
  private static readonly KEY_PREFIX = "token:blacklist:";

  // 内存存储作为备份机制
  private static blacklistedTokens: Set<string> = new Set();
  private static tokenExpirations: Map<string, number> = new Map();

  // 定期清理间隔（毫秒）
  private static readonly CLEANUP_INTERVAL = 3600000; // 1小时

  static {
    // 启动定期清理任务
    setInterval(() => this.cleanupExpiredTokens(), this.CLEANUP_INTERVAL);
  }

  /**
   * 将令牌添加到黑名单
   * @param token JWT令牌
   * @param expiresAt 令牌过期时间戳（毫秒）
   */
  static async addToBlacklist(token: string, expiresAt: number): Promise<void> {
    try {
      // 计算令牌剩余有效期（秒）
      const ttl = Math.floor((expiresAt - Date.now()) / 1000);

      // 只有当令牌还未过期时才添加到Redis
      if (ttl > 0) {
        await redisClient.set(`${this.KEY_PREFIX}${token}`, "1", "EX", ttl);
        logger.debug(`令牌已添加到Redis黑名单，过期时间: ${ttl}秒`);
      }
    } catch (error) {
      logger.error("将令牌添加到Redis黑名单时出错", { error });
      // 降级到内存存储作为备份
      this.fallbackAddToBlacklist(token, expiresAt);
    }
  }

  /**
   * 检查令牌是否在黑名单中
   * @param token JWT令牌
   * @returns 如果令牌在黑名单中返回true，否则返回false
   */
  static async isBlacklisted(token: string): Promise<boolean> {
    try {
      const exists = await redisClient.exists(`${this.KEY_PREFIX}${token}`);
      return exists === 1;
    } catch (error) {
      logger.error("检查Redis令牌黑名单状态时出错", { error });
      // 降级到内存存储作为备份
      return this.fallbackIsBlacklisted(token);
    }
  }

  /**
   * 获取黑名单大小（仅内存备份部分）
   * @returns 内存黑名单中的令牌数量
   */
  static getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }

  /**
   * 内存备份：添加令牌到黑名单
   */
  private static fallbackAddToBlacklist(
    token: string,
    expiresAt: number
  ): void {
    this.blacklistedTokens.add(token);
    this.tokenExpirations.set(token, expiresAt);
    logger.warn("使用内存备份存储令牌黑名单", {
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  /**
   * 内存备份：检查令牌是否在黑名单中
   */
  private static fallbackIsBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * 清理已过期的内存黑名单令牌
   */
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [token, expiresAt] of this.tokenExpirations.entries()) {
      if (expiresAt <= now) {
        this.blacklistedTokens.delete(token);
        this.tokenExpirations.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`已清理 ${cleanedCount} 个过期的内存黑名单令牌`);
    }
  }
}
