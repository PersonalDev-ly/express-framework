import * as crypto from "crypto";

export class HashPassword {
  /**
   * 哈希密码
   * @param password 明文密码
   * @returns 哈希后的密码
   */
  static hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  /**
   * 验证用户密码
   * @param plainPassword 明文密码
   * @param hashedPassword 哈希后的密码
   * @returns 密码是否匹配
   */
  static verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): boolean {
    const hash = crypto
      .createHash("sha256")
      .update(plainPassword)
      .digest("hex");
    return hash === hashedPassword;
  }
}
