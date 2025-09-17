import { randomUUID } from 'crypto';
import { Context } from 'koa';

import { AppDataSource } from '../config/database';
import { SHARE_STATUS } from '../constants/files';
import { File } from '../entities/File';
import { Share } from '../entities/Share';
import { FileDownloadService } from '../services/FileDownloadService';
import { generateDownloadToken, verifyDownloadToken } from '../utils/downloadToken';
import logger from '../utils/logger';

/**
 * 验证用户身份并获取用户ID
 */
const getUserId = (ctx: Context): string => {
  const userId = ctx.state.auth?.sub;
  if (!userId) {
    throw new Error('未认证的用户');
  }
  return userId;
};

export class ShareController {
  // 检查文件分享状态
  static async getFileShareStatus(ctx: Context) {
    try {
      const { fileId } = ctx.params;

      if (!fileId) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '文件ID不能为空' };
        return;
      }

      const shareRepo = AppDataSource.getRepository(Share);
      const fileRepo = AppDataSource.getRepository(File);

      // 获取当前用户ID
      const userId = getUserId(ctx);

      // 检查文件是否存在并属于当前用户
      const file = await fileRepo.findOne({
        where: { id: fileId, user_id: userId },
      });

      if (!file) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '文件不存在' };
        return;
      }

      // 查找分享记录
      const share = await shareRepo.findOne({
        where: { file_id: fileId },
      });

      if (!share) {
        ctx.body = {
          code: 200,
          message: 'success',
          data: {
            hasShare: false,
          },
        };
        return;
      }

      const isExpired = share.expired_at && new Date() > share.expired_at;

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          hasShare: true,
          share: {
            id: share.id,
            shareId: share.share_id,
            hasPassword: !!share.password,
            expiredAt: share.expired_at,
            status: isExpired ? SHARE_STATUS.EXPIRED : SHARE_STATUS.ACTIVE,
            accessCount: share.access_count,
            createdAt: share.created_at,
          },
        },
      };
    } catch (error) {
      logger.error('获取文件分享状态失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '服务器内部错误' };
    }
  }

  // 创建或更新分享
  static async createShare(ctx: Context) {
    try {
      const { fileId, password, expiredAt } = (ctx.request as any).body as {
        fileId: string;
        password?: string;
        expiredAt?: string;
      };

      if (!fileId) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '文件ID不能为空' };
        return;
      }

      const fileRepo = AppDataSource.getRepository(File);
      const shareRepo = AppDataSource.getRepository(Share);

      // 获取当前用户ID
      const userId = getUserId(ctx);

      // 检查文件是否存在并属于当前用户
      const file = await fileRepo.findOne({
        where: { id: fileId, user_id: userId },
      });

      if (!file) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '文件不存在' };
        return;
      }

      // 检查是否已有分享记录
      const existingShare = await shareRepo.findOne({
        where: { file_id: fileId },
      });

      // 处理过期时间
      let expiredAtDate: Date | null = null;
      if (expiredAt) {
        expiredAtDate = new Date(expiredAt);
        if (isNaN(expiredAtDate.getTime())) {
          ctx.status = 400;
          ctx.body = { code: 400, message: '过期时间格式无效' };
          return;
        }
      }

      let share: Share;
      let isNew = false;

      if (existingShare) {
        // 更新现有分享
        existingShare.password = password || null;
        existingShare.expired_at = expiredAtDate;
        share = await shareRepo.save(existingShare);
        logger.info(`更新分享成功: ${share.share_id}`);
      } else {
        // 创建新分享记录
        const shareId = randomUUID();
        share = shareRepo.create({
          file_id: fileId,
          share_id: shareId,
          password: password || null,
          expired_at: expiredAtDate,
          access_count: 0,
        });
        share = await shareRepo.save(share);
        isNew = true;
        logger.info(`创建分享成功: ${shareId}`);
      }

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          id: share.id,
          shareId: share.share_id,
          password: share.password,
          expiredAt: share.expired_at,
          createdAt: share.created_at,
          isNew,
        },
      };
    } catch (error) {
      logger.error('创建分享失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '服务器内部错误' };
    }
  }

  // 获取分享内容
  static async getShare(ctx: Context) {
    try {
      const { shareId } = ctx.params;
      const { password } = ctx.query;

      if (!shareId) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '分享ID不能为空' };
        return;
      }

      // 验证 UUID 格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(shareId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的分享ID格式' };
        return;
      }

      const shareRepo = AppDataSource.getRepository(Share);

      // 查找分享记录，包含文件信息
      const share = await shareRepo.findOne({
        where: { share_id: shareId },
        relations: ['file'],
      });

      if (!share) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '分享不存在' };
        return;
      }

      // 检查是否过期
      if (share.expired_at && new Date() > share.expired_at) {
        ctx.status = 410;
        ctx.body = { code: 410, message: '分享已过期' };
        return;
      }

      // 检查密码
      if (share.password && share.password !== password) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '密码错误' };
        return;
      }

      // 增加访问次数
      share.access_count += 1;
      await shareRepo.save(share);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          share: {
            id: share.id,
            expiredAt: share.expired_at,
            hasPassword: !!share.password,
            createdAt: share.created_at,
          },
          file: {
            id: share.file.id,
            name: share.file.name,
            size: share.file.size,
            type: share.file.type,
            isFolder: share.file.is_folder,
          },
        },
      };
    } catch (error) {
      logger.error('获取分享失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '服务器内部错误' };
    }
  }

  // 下载分享文件
  static async downloadShare(ctx: Context) {
    try {
      const { shareId } = ctx.params;
      const { password, token } = ctx.query;

      if (!shareId) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '分享ID不能为空' };
        return;
      }

      // 如果有token，优先使用token验证
      if (token) {
        logger.info(`开始验证token: ${token}`);
        try {
          const tokenPayload = verifyDownloadToken(token as string);
          logger.info(`Token验证成功: ${JSON.stringify(tokenPayload)}`);

          // 验证token中的分享ID是否匹配
          if (tokenPayload.type !== 'share' || tokenPayload.shareId !== shareId) {
            logger.error(
              `Token验证失败: type=${tokenPayload.type}, shareId=${tokenPayload.shareId}, expected=${shareId}`
            );
            ctx.status = 401;
            ctx.body = { code: 401, message: '无效的下载token' };
            return;
          }

          logger.info(`Token类型和分享ID验证通过`);

          // 使用token中的密码（如果有）
          const tokenPassword = tokenPayload.password;
          logger.info(`Token中的密码: ${tokenPassword ? '有密码' : '无密码'}`);

          // 查找分享记录并验证
          const shareRepo = AppDataSource.getRepository(Share);
          const share = await shareRepo.findOne({
            where: { share_id: shareId },
            relations: ['file'],
          });

          if (!share) {
            logger.error(`分享不存在: shareId=${shareId}`);
            ctx.status = 404;
            ctx.body = { code: 404, message: '分享不存在' };
            return;
          }

          logger.info(
            `找到分享记录: ${share.file.name}, 分享密码: ${share.password ? '需要密码' : '无需密码'}`
          );

          // 检查是否过期
          if (share.expired_at && new Date() > share.expired_at) {
            logger.error(`分享已过期: shareId=${shareId}, expiredAt=${share.expired_at}`);
            ctx.status = 410;
            ctx.body = { code: 410, message: '分享已过期' };
            return;
          }

          // 检查密码验证
          if (share.password) {
            // 如果分享需要密码，但token中没有密码，则验证失败
            if (!tokenPassword) {
              logger.error(`分享需要密码但token中没有密码: shareId=${shareId}`);
              ctx.status = 401;
              ctx.body = { code: 401, message: '无效的下载token，缺少密码验证' };
              return;
            }
            // 验证密码是否正确
            if (share.password !== tokenPassword) {
              logger.error(
                `分享密码不匹配: shareId=${shareId}, 期望=${share.password}, 实际=${tokenPassword}`
              );
              ctx.status = 401;
              ctx.body = { code: 401, message: '密码错误' };
              return;
            }
            logger.info(`密码验证通过`);
          } else {
            logger.info(`分享无需密码，跳过密码验证`);
          }

          // 直接下载文件，跳过后面的验证
          await FileDownloadService.handleFileDownload(ctx, share.file, 'share', {
            shareId,
            hasPassword: !!share.password,
          });
          return;
        } catch (error) {
          logger.error(
            `Token验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          ctx.status = 401;
          ctx.body = { code: 401, message: '无效的下载token' };
          return;
        }
      }

      // 原有的验证逻辑（当没有token时）
      // 验证 UUID 格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(shareId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的分享ID格式' };
        return;
      }

      const shareRepo = AppDataSource.getRepository(Share);

      // 查找分享记录，包含文件信息
      const share = await shareRepo.findOne({
        where: { share_id: shareId },
        relations: ['file'],
      });

      if (!share) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '分享不存在' };
        return;
      }

      // 检查是否过期
      if (share.expired_at && new Date() > share.expired_at) {
        ctx.status = 410;
        ctx.body = { code: 410, message: '分享已过期' };
        return;
      }

      // 检查密码
      if (share.password && share.password !== password) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '密码错误' };
        return;
      }

      await FileDownloadService.handleFileDownload(ctx, share.file, 'share', {
        shareId,
        hasPassword: !!share.password,
      });
    } catch (error) {
      FileDownloadService.handleDownloadError(ctx, error, 'share');
    }
  }

  // 更新分享设置
  static async updateShare(ctx: Context) {
    try {
      const { id } = ctx.params;
      const { password, expiredAt } = (ctx.request as any).body as {
        password?: string;
        expiredAt?: string;
      };

      if (!id) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '分享ID不能为空' };
        return;
      }

      const shareRepo = AppDataSource.getRepository(Share);

      // 获取当前用户ID
      const userId = getUserId(ctx);

      // 查找分享记录，包含文件信息以验证权限
      const share = await shareRepo.findOne({
        where: { id },
        relations: ['file'],
      });

      if (!share) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '分享不存在' };
        return;
      }

      // 检查是否为文件所有者
      if (share.file.user_id !== userId) {
        ctx.status = 403;
        ctx.body = { code: 403, message: '无权限操作' };
        return;
      }

      // 更新分享设置
      if (password !== undefined) {
        share.password = password || null;
      }

      if (expiredAt !== undefined) {
        if (expiredAt) {
          const expiredAtDate = new Date(expiredAt);
          if (isNaN(expiredAtDate.getTime())) {
            ctx.status = 400;
            ctx.body = { code: 400, message: '过期时间格式无效' };
            return;
          }
          share.expired_at = expiredAtDate;
        } else {
          share.expired_at = null;
        }
      }

      await shareRepo.save(share);

      logger.info(`更新分享设置成功: ${id}`);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          id: share.id,
          shareId: share.share_id,
          password: share.password,
          expiredAt: share.expired_at,
        },
      };
    } catch (error) {
      logger.error('更新分享设置失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '服务器内部错误' };
    }
  }

  // 取消分享
  static async deleteShare(ctx: Context) {
    try {
      const { id } = ctx.params;

      if (!id) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '分享ID不能为空' };
        return;
      }

      const shareRepo = AppDataSource.getRepository(Share);

      // 获取当前用户ID
      const userId = getUserId(ctx);

      // 查找分享记录，包含文件信息以验证权限
      const share = await shareRepo.findOne({
        where: { id },
        relations: ['file'],
      });

      if (!share) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '分享不存在' };
        return;
      }

      // 检查是否为文件所有者
      if (share.file.user_id !== userId) {
        ctx.status = 403;
        ctx.body = { code: 403, message: '无权限操作' };
        return;
      }

      // 删除分享记录
      await shareRepo.remove(share);

      logger.info(`取消分享成功: ${id}`);

      ctx.body = {
        code: 200,
        message: 'success',
      };
    } catch (error) {
      logger.error('取消分享失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '服务器内部错误' };
    }
  }

  // 获取分享列表
  static async getShareList(ctx: Context) {
    try {
      const {
        page = '1',
        pageSize = '20',
        status = SHARE_STATUS.ACTIVE,
      } = ctx.query as {
        page?: string;
        pageSize?: string;
        status?: 'active' | 'expired' | 'all';
      };

      const pageNum = parseInt(page, 10);
      const pageSizeNum = parseInt(pageSize, 10);
      const offset = (pageNum - 1) * pageSizeNum;

      const shareRepo = AppDataSource.getRepository(Share);

      // 获取当前用户ID
      const userId = getUserId(ctx);

      // 构建查询条件
      const queryBuilder = shareRepo
        .createQueryBuilder('share')
        .leftJoinAndSelect('share.file', 'file')
        .where('file.user_id = :userId', { userId });

      // 根据状态筛选
      if (status === SHARE_STATUS.ACTIVE) {
        queryBuilder.andWhere('(share.expired_at IS NULL OR share.expired_at > :now)', {
          now: new Date(),
        });
      } else if (status === SHARE_STATUS.EXPIRED) {
        queryBuilder.andWhere('share.expired_at IS NOT NULL AND share.expired_at <= :now', {
          now: new Date(),
        });
      }

      // 排序和分页
      queryBuilder.orderBy('share.created_at', 'DESC').skip(offset).take(pageSizeNum);

      const [shares, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / pageSizeNum);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          shares: shares.map(share => {
            const isExpired = share.expired_at && new Date() > share.expired_at;
            return {
              id: share.id,
              fileId: share.file_id,
              fileName: share.file.name,
              shareId: share.share_id,
              hasPassword: !!share.password,
              expiredAt: share.expired_at,
              status: isExpired ? SHARE_STATUS.EXPIRED : SHARE_STATUS.ACTIVE,
              accessCount: share.access_count,
              createdAt: share.created_at,
            };
          }),
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            total,
            totalPages,
          },
        },
      };
    } catch (error) {
      logger.error('获取分享列表失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '服务器内部错误' };
    }
  }

  // 生成临时下载链接
  static async generateDownloadLink(ctx: Context) {
    try {
      const { shareId } = ctx.params;
      const { password } = ctx.query;

      if (!shareId) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '分享ID不能为空' };
        return;
      }

      // 验证 UUID 格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(shareId)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '无效的分享ID格式' };
        return;
      }

      const shareRepo = AppDataSource.getRepository(Share);

      // 查找分享记录，包含文件信息
      const share = await shareRepo.findOne({
        where: { share_id: shareId },
        relations: ['file'],
      });

      if (!share) {
        ctx.status = 404;
        ctx.body = { code: 404, message: '分享不存在' };
        return;
      }

      // 检查是否过期
      if (share.expired_at && new Date() > share.expired_at) {
        ctx.status = 410;
        ctx.body = { code: 410, message: '分享已过期' };
        return;
      }

      // 检查密码
      if (share.password && share.password !== password) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '密码错误' };
        return;
      }

      // 生成临时下载token
      const tokenPayload: any = {
        type: 'share',
        shareId: shareId,
      };

      // 只有当密码存在时才添加到token中
      if (password) {
        tokenPayload.password = password as string;
      }

      const downloadToken = generateDownloadToken(tokenPayload);

      // 构建完整的下载链接
      const port = process.env.PORT || 3000;
      const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
      const downloadUrl = `${baseUrl}/shares/${shareId}/download?token=${downloadToken}`;

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          downloadUrl,
          token: downloadToken,
          expiresIn: 3600, // 1小时，以秒为单位
          fileName: share.file.name,
          fileSize: share.file.size,
        },
      };

      logger.info(`生成临时下载链接成功: ${shareId} - ${share.file.name}`);
    } catch (error) {
      logger.error('生成临时下载链接失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '服务器内部错误' };
    }
  }
}
