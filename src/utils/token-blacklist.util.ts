/**
 * 令牌黑名单工具类
 * 用于管理已吊销的JWT令牌
 */
export class TokenBlacklistUtil {
  // 使用Set存储已吊销的令牌，提高查找效率
  private static blacklistedTokens: Set<string> = new Set();

  // 存储令牌过期时间，用于清理过期的黑名单条目
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
  static addToBlacklist(token: string, expiresAt: number): void {
    this.blacklistedTokens.add(token);
    this.tokenExpirations.set(token, expiresAt);
    console.log(
      `令牌已添加到黑名单，将在 ${new Date(expiresAt).toISOString()} 过期`
    );
  }

  /**
   * 检查令牌是否在黑名单中
   * @param token JWT令牌
   * @returns 如果令牌在黑名单中返回true，否则返回false
   */
  static isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * 清理已过期的黑名单令牌
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
      console.log(`已清理 ${cleanedCount} 个过期的黑名单令牌`);
    }
  }

  /**
   * 获取黑名单大小
   * @returns 黑名单中的令牌数量
   */
  static getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }
}
