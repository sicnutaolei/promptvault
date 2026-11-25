/** 站点级常量与对外地址（服务端使用）。 */
export const SITE_NAME = process.env.SITE_NAME || 'PromptVault';

export function siteUrl(): string {
  const raw = process.env.SITE_URL || 'http://localhost:3000';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:3000';
  }
}
