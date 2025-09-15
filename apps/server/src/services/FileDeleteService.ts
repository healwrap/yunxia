import * as fs from 'fs/promises';
import { Not } from 'typeorm';

import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { File } from '../entities/File';
import { Share } from '../entities/Share';
import logger from '../utils/logger';

/**
 * 文件删除服务 - 统一处理文件删除相关逻辑
 */
export class FileDeleteService {
  /**
   * 删除与文件相关的分享记录
   */
  static async deleteRelatedShares(fileId: string): Promise<void> {
    try {
      const shareRepository = AppDataSource.getRepository(Share);
      const deletedShares = await shareRepository.delete({ file_id: fileId });
      logger.info(`删除文件相关分享记录: ${fileId}, 删除数量: ${deletedShares.affected || 0}`);
    } catch (error) {
      logger.error(`删除文件相关分享记录失败: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * 永久删除文件的物理文件（如果没有其他引用）
   */
  static async deletePhysicalFileIfNoReferences(
    file: File,
    controllerName = 'Unknown'
  ): Promise<void> {
    try {
      if (!file.is_folder && file.path && file.md5) {
        logger.info(`[${controllerName}] 检查文件引用: ${file.path} (MD5: ${file.md5})`);

        const fileRepository = AppDataSource.getRepository(File);

        // 分别查询ACTIVE和TRASH状态的引用
        const activeReferences = await fileRepository.count({
          where: {
            md5: file.md5,
            status: FILE_STATUS.ACTIVE,
          },
        });

        const trashReferences = await fileRepository.count({
          where: {
            md5: file.md5,
            status: FILE_STATUS.TRASH,
            id: Not(file.id), // 排除当前要删除的文件记录
          },
        });

        const totalOtherReferences = activeReferences + trashReferences;

        logger.info(
          `[${controllerName}] 文件引用统计 - ACTIVE: ${activeReferences}, TRASH(排除当前): ${trashReferences}, 总计其他引用: ${totalOtherReferences}`
        );

        // 如果没有其他文件记录引用，则删除物理文件
        if (totalOtherReferences === 0) {
          await fs.unlink(file.path);
          logger.info(`[${controllerName}] ✅ 物理文件已删除: ${file.path} (MD5: ${file.md5})`);
        } else {
          logger.info(
            `[${controllerName}] ⚠️ 物理文件被其他 ${totalOtherReferences} 个文件记录引用，保留文件: ${file.path} (MD5: ${file.md5})`
          );
        }
      } else {
        logger.info(
          `[${controllerName}] 跳过文件删除检查: is_folder=${file.is_folder}, path=${file.path}, md5=${file.md5}`
        );
      }
    } catch (error) {
      logger.error(`[${controllerName}] 删除物理文件失败: ${file.path}`, error);
      throw error;
    }
  }

  /**
   * 完整的永久删除文件流程
   * 1. 删除相关分享记录
   * 2. 删除物理文件（如果没有其他引用）
   * 3. 删除数据库记录
   */
  static async permanentlyDeleteFile(file: File, controllerName = 'Unknown'): Promise<void> {
    try {
      // 1. 删除相关分享记录
      await this.deleteRelatedShares(file.id);

      // 2. 删除物理文件（如果需要）
      await this.deletePhysicalFileIfNoReferences(file, controllerName);

      // 3. 删除数据库记录
      const fileRepository = AppDataSource.getRepository(File);
      await fileRepository.remove(file);

      logger.info(`[${controllerName}] ✅ 文件完全删除: ${file.name} (ID: ${file.id})`);
    } catch (error) {
      logger.error(`[${controllerName}] 永久删除文件失败: ${file.id}`, error);
      throw error;
    }
  }
}
