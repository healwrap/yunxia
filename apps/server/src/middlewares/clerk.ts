import { clerkClient } from '@clerk/clerk-sdk-node';
import { Context, Next } from 'koa';

import logger from '../utils/logger';

// Clerk 中间件 - 验证用户身份
export const clerkMiddleware = () => {
  return async (ctx: Context, next: Next) => {
    // 从请求头获取会话令牌
    const authHeader = ctx.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 无认证信息，不阻止继续处理，但设置 auth 为 null
      ctx.state.auth = null;
      return await next();
    }

    const sessionToken = authHeader.split(' ')[1];

    // 使用 Clerk 验证会话
    try {
      const sessionClaims = await clerkClient.verifyToken(sessionToken);
      // 将用户信息保存到 ctx.state
      ctx.state.auth = sessionClaims;
    } catch {
      // 令牌验证失败
      logger.warn('Token verification failed');
      ctx.state.auth = null;
    }

    // 继续处理
    await next();
  };
};

// 验证用户必须已授权的中间件
export const requireAuth = () => {
  return async (ctx: Context, next: Next) => {
    if (!ctx.state.auth) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '未授权', data: null };
      return;
    }
    await next();
  };
};

// 辅助函数: 获取当前用户ID
export const getCurrentUserId = (ctx: Context): string | null => {
  return ctx.state.auth?.sub || null;
};

// 辅助函数: 获取当前用户对象
export const getCurrentUser = async (ctx: Context) => {
  const userId = getCurrentUserId(ctx);
  if (!userId) return null;
  return await clerkClient.users.getUser(userId);
};
