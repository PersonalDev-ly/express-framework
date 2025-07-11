import * as bcrypt from "bcrypt";

export class HashPassword {
  private static readonly SALT_ROUNDS = 10;

  /**
   * 哈希密码（异步）
   * @param password 明文密码
   * @returns 哈希后的密码
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * 验证用户密码（异步）
   * @param plainPassword 明文密码
   * @param hashedPassword 哈希后的密码（从数据库读取）
   * @returns 密码是否匹配
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
