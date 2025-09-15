import jwt from 'jsonwebtoken';

// JWT密钥，在生产环境中应该从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || 'yunxia-download-secret-2024';
const TOKEN_EXPIRY = process.env.DOWNLOAD_TOKEN_EXPIRY || '1h'; // 默认1小时过期

export interface DownloadTokenPayload {
  shareId?: string; // 分享ID（分享下载）
  fileId?: string; // 文件ID（普通下载）
  userId?: string; // 用户ID（仅普通下载需要）
  password?: string; // 分享密码（如果有）
  type: 'share' | 'file'; // 下载类型
  exp?: number; // 过期时间
}

/**
 * 生成临时下载token
 */
export function generateDownloadToken(payload: Omit<DownloadTokenPayload, 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * 验证并解析下载token
 */
export function verifyDownloadToken(token: string): DownloadTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as DownloadTokenPayload;
    return decoded;
  } catch {
    throw new Error('无效的下载token');
  }
}

/**
 * 检查token是否即将过期（15分钟内过期）
 */
export function isTokenExpiringSoon(payload: DownloadTokenPayload): boolean {
  if (!payload.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - now;

  // 如果15分钟内过期，返回true
  return timeUntilExpiry < 15 * 60;
}
