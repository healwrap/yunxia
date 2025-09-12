import { Context, Next } from 'koa';

import { UserStorageService } from '../services/UserStorageService';
import logger from '../utils/logger';

/**
 * 用户存储初始化中间件
 * 在用户首次访问时自动初始化存储信息
 */
export const userStorageInitMiddleware = async (ctx: Context, next: Next) => {
  try {
    // 检查是否有认证用户
    const userId = ctx.state.auth?.userId || ctx.state.auth?.sub;
    if (userId) {
      const userStorageService = new UserStorageService();

      // 确保用户存储信息已初始化
      await userStorageService.initializeUserStorage(userId);
    }

    await next();
  } catch (error) {
    logger.error('用户存储初始化中间件执行失败:', error);
    // 不阻断请求，继续执行
    await next();
  }
};
