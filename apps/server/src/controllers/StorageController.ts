import { Context } from 'koa';

import { UserStorageService } from '../services/UserStorageService';
import logger from '../utils/logger';

export class StorageController {
  private userStorageService: UserStorageService;

  constructor() {
    this.userStorageService = new UserStorageService();
  }

  /**
   * 获取用户存储信息
   */
  async getStorageInfo(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const stats = await this.userStorageService.getStorageStats(userId);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          totalSpace: Number(stats.totalSpace),
          usedSpace: Number(stats.usedSpace),
          availableSpace: Number(stats.availableSpace),
          usagePercentage: stats.usagePercentage,
          fileTypeStats: stats.fileTypeStats,
        },
      };
    } catch (error) {
      logger.error('获取存储信息失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取存储信息失败',
      };
    }
  }

  /**
   * 初始化用户存储（用户注册时调用）
   */
  async initializeStorage(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const storage = await this.userStorageService.initializeUserStorage(userId);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          id: storage.id,
          totalSpace: Number(storage.total_space),
          usedSpace: Number(storage.used_space),
          createdAt: storage.created_at,
        },
      };
    } catch (error) {
      logger.error('初始化用户存储失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '初始化用户存储失败',
      };
    }
  }

  /**
   * 重新计算用户存储空间
   */
  async recalculateStorage(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const storage = await this.userStorageService.recalculateUsedSpace(userId);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          totalSpace: Number(storage.total_space),
          usedSpace: Number(storage.used_space),
          updatedAt: storage.updated_at,
        },
      };
    } catch (error) {
      logger.error('重新计算存储空间失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '重新计算存储空间失败',
      };
    }
  }
}
