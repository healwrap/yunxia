import { Context } from 'koa';
import { In } from 'typeorm';

import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { DEFAULT_PAGE_SIZE } from '../constants/page';
import { File } from '../entities/File';
import { FileDeleteService } from '../services/FileDeleteService';
import { FileNameService } from '../services/FileNameService';
import { FilePathService } from '../services/FilePathService';
import { FileRecursiveService } from '../services/FileRecursiveService';
import { UserStorageService } from '../services/UserStorageService';
import logger from '../utils/logger';

export class TrashController {
  private userStorageService: UserStorageService;

  constructor() {
    this.userStorageService = new UserStorageService();
  }

  async getTrashFiles(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = ctx.query as {
        page?: number;
        pageSize?: number;
      };

      const fileRepository = AppDataSource.getRepository(File);

      // 只获取根级删除的文件（父文件夹未被删除的项目）
      const queryBuilder = fileRepository
        .createQueryBuilder('file')
        .where('file.user_id = :userId', { userId })
        .andWhere('file.status = :status', { status: FILE_STATUS.TRASH })
        .andWhere(qb => {
          // 排除父文件夹也在回收站的文件
          const subQuery = qb
            .subQuery()
            .select('1')
            .from(File, 'parent')
            .where('parent.id = file.parent_id')
            .andWhere('parent.status = :trashStatus', { trashStatus: FILE_STATUS.TRASH })
            .getQuery();
          return `NOT EXISTS (${subQuery})`;
        })
        .orderBy('file.deleted_at', 'DESC')
        .addOrderBy('file.updated_at', 'DESC');

      const skip = (Number(page) - 1) * Number(pageSize);
      queryBuilder.skip(skip).take(Number(pageSize));
      const [files, total] = await queryBuilder.getManyAndCount();

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          files,
          pagination: {
            current: Number(page),
            pageSize: Number(pageSize),
            total,
            pages: Math.ceil(total / Number(pageSize)),
          },
        },
      };
    } catch (error) {
      logger.error('获取回收站文件列表失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '获取回收站文件列表失败' };
    }
  }

  async restoreFiles(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const { ids } = (ctx.request as any).body as { ids: string[] };
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        ctx.status = 400;
        ctx.body = { code: 400, message: '请提供要恢复的文件ID列表' };
        return;
      }

      const fileRepository = AppDataSource.getRepository(File);
      const restoredItems: Array<{ id: string; name: string; type: string }> = [];
      const failedIds: string[] = [];

      for (const fileId of ids) {
        try {
          const file = await fileRepository.findOne({
            where: { id: fileId, user_id: userId, status: FILE_STATUS.TRASH },
          });

          if (!file) {
            failedIds.push(fileId);
            continue;
          }

          // 检查父文件夹是否存在且有效
          let targetParentId = file.parent_id;
          if (targetParentId) {
            const parentExists = await FilePathService.isFileInValidPath(targetParentId, userId);
            if (!parentExists) {
              // 父文件夹不存在或已删除，创建一个新的文件夹或移到根目录
              logger.info(`文件 ${file.name} 的父文件夹不存在，将恢复到根目录`);
              targetParentId = null;
            }
          }

          // 检查目标位置是否有同名文件，如果有则生成唯一名称
          const uniqueName = await FileNameService.generateUniqueFileName(
            file.name,
            targetParentId,
            userId,
            file.id
          );

          // 恢复文件
          file.status = FILE_STATUS.ACTIVE;
          file.name = uniqueName;
          file.parent_id = targetParentId;
          file.deleted_at = null;
          file.updated_at = new Date();
          await fileRepository.save(file);

          // 如果是文件夹，递归恢复其子项
          if (file.is_folder) {
            await FileRecursiveService.recursiveRestore(file.id, userId);
          }

          restoredItems.push({
            id: file.id,
            name: uniqueName, // 使用实际的文件名（可能被重命名）
            type: file.is_folder ? 'folder' : 'file',
          });
        } catch (error) {
          logger.error(`恢复文件失败: ${fileId}`, error);
          failedIds.push(fileId);
        }
      }

      ctx.body = {
        code: 200,
        message: 'success',
        data: { restoredCount: restoredItems.length, failedIds, restoredItems },
      };
    } catch (error) {
      logger.error('恢复文件失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '恢复文件失败' };
    }
  }

  async clearTrash(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const { ids } = (ctx.request as any).body as { ids?: string[] };
      const fileRepository = AppDataSource.getRepository(File);
      let filesToDelete: File[];

      if (ids && Array.isArray(ids) && ids.length > 0) {
        filesToDelete = await fileRepository.find({
          where: { id: In(ids), user_id: userId, status: FILE_STATUS.TRASH },
        });
      } else {
        filesToDelete = await fileRepository.find({
          where: { user_id: userId, status: FILE_STATUS.TRASH },
        });
      }

      const deletedItems: Array<{ id: string; name: string; type: string }> = [];
      let totalDeletedSize = 0n;

      for (const file of filesToDelete) {
        try {
          await FileDeleteService.permanentlyDeleteFile(file, 'TrashController');
          if (!file.is_folder && file.size) {
            totalDeletedSize += BigInt(file.size);
          }
          deletedItems.push({
            id: file.id,
            name: file.name,
            type: file.is_folder ? 'folder' : 'file',
          });
        } catch (error) {
          logger.error(`永久删除文件失败: ${file.id}`, error);
        }
      }

      if (totalDeletedSize > 0n) {
        await this.userStorageService.updateUsedSpace(userId, -totalDeletedSize);
      }

      ctx.body = {
        code: 200,
        message: 'success',
        data: { deletedCount: deletedItems.length, deletedItems },
      };
    } catch (error) {
      logger.error('清空回收站失败:', error);
      ctx.status = 500;
      ctx.body = { code: 500, message: '清空回收站失败' };
    }
  }
}
