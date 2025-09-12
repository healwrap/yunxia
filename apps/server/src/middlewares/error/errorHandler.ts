import { Context, Next } from 'koa';

import logger from '../../utils/logger';

/**
 * 全局错误处理中间件
 * 捕获所有未处理的错误，统一处理，记录日志
 */
export const errorHandler = () => async (ctx: Context, next: Next) => {
  try {
    // 记录请求日志
    logger.info(`${ctx.method} ${ctx.url} - 请求开始`);

    // 尝试处理请求
    await next();

    // 记录响应日志
    const status = ctx.status || 404;
    logger.info(`${ctx.method} ${ctx.url} - 响应状态: ${status}`);
  } catch (error) {
    // 记录错误日志
    const err = error as Error;
    logger.error(`${ctx.method} ${ctx.url} - 错误: ${err.message}`, {
      error: err.stack,
      params: ctx.params,
      query: ctx.query,
    });

    // 设置响应状态和错误信息
    ctx.status = err.name === 'ValidationError' ? 400 : 500;
    ctx.body = {
      code: ctx.status,
      message: err.name === 'ValidationError' ? '请求参数错误' : '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    };
  }
};
