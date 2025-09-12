import fs from 'fs';
import path from 'path';

import logger from '../logger';

/**
 * 初始化日志目录
 */
export const initializeLogDirectory = async (): Promise<void> => {
  try {
    // 定义日志目录路径
    const logsDir = path.join(process.cwd(), 'logs');

    // 检查日志目录是否存在
    if (!fs.existsSync(logsDir)) {
      // 创建日志目录
      fs.mkdirSync(logsDir, { recursive: true });
      logger.info(`日志目录已创建: ${logsDir}`);
    } else {
      logger.info(`日志目录已存在: ${logsDir}`);
    }
  } catch (error) {
    const err = error as Error;
    // eslint-disable-next-line no-console
    console.error('初始化日志目录失败:', err.message);
    throw err;
  }
};
