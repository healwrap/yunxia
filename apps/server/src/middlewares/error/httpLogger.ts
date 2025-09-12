import { Context, Next } from 'koa';

import logger from '../../utils/logger';

/**
 * HTTP 请求日志中间件
 * 记录所有请求的详细信息和响应时间
 */
export const httpLogger = () => async (ctx: Context, next: Next) => {
  // 请求开始时间
  const start = Date.now();

  // 记录请求信息
  logger.info(`--> ${ctx.method} ${ctx.url}`, {
    ip: ctx.ip,
    userAgent: ctx.headers['user-agent'],
    query: ctx.query,
  });

  // 处理请求
  await next();

  // 计算响应时间
  const ms = Date.now() - start;

  // 记录响应信息
  const status = ctx.status;
  const logLevel = status >= 400 ? 'warn' : 'info';

  logger.log(logLevel, `<-- ${ctx.method} ${ctx.url} ${status} ${ms}ms`);
};
