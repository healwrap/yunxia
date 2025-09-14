import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { File } from '../entities/File';
import logger from '../utils/logger';

/**
 * 文件递归操作服务
 */
export class FileRecursiveService {
  /**
   * 递归标记删除文件夹下的所有子项
   */
  static async recursiveMarkAsDeleted(fileId: string, userId: string): Promise<void> {
    const fileRepository = AppDataSource.getRepository(File);

    // 获取所有子项
    const children = await fileRepository.find({
      where: {
        parent_id: fileId,
        user_id: userId,
        status: FILE_STATUS.ACTIVE,
      },
    });

    for (const child of children) {
      // 标记子项为删除状态
      child.status = FILE_STATUS.TRASH;
      child.deleted_at = new Date();
      child.updated_at = new Date();
      await fileRepository.save(child);

      // 如果子项是文件夹，递归处理其子项
      if (child.is_folder) {
        await this.recursiveMarkAsDeleted(child.id, userId);
      }

      logger.info(`递归删除子项: ${child.name} (${child.id})`);
    }
  }

  /**
   * 获取文件夹下所有子项的总数（用于统计）
   */
  static async getChildrenCount(fileId: string, userId: string): Promise<number> {
    const fileRepository = AppDataSource.getRepository(File);

    const directChildren = await fileRepository.find({
      where: {
        parent_id: fileId,
        user_id: userId,
        status: FILE_STATUS.ACTIVE,
      },
    });

    let totalCount = directChildren.length;

    for (const child of directChildren) {
      if (child.is_folder) {
        totalCount += await this.getChildrenCount(child.id, userId);
      }
    }

    return totalCount;
  }

  /**
   * 递归获取文件夹下所有文件的总大小
   */
  static async getChildrenSize(fileId: string, userId: string): Promise<bigint> {
    const fileRepository = AppDataSource.getRepository(File);

    const children = await fileRepository.find({
      where: {
        parent_id: fileId,
        user_id: userId,
        status: FILE_STATUS.ACTIVE,
      },
    });

    let totalSize = 0n;

    for (const child of children) {
      if (child.is_folder) {
        // 递归处理子文件夹
        totalSize += await this.getChildrenSize(child.id, userId);
      } else if (child.size) {
        // 累加文件大小
        totalSize += BigInt(child.size);
      }
    }

    return totalSize;
  }

  /**
   * 递归恢复文件夹下的所有子项
   */
  static async recursiveRestore(fileId: string, userId: string): Promise<number> {
    const fileRepository = AppDataSource.getRepository(File);

    const children = await fileRepository.find({
      where: {
        parent_id: fileId,
        user_id: userId,
        status: FILE_STATUS.TRASH,
      },
    });

    let restoredCount = 0;

    for (const child of children) {
      // 恢复子项
      child.status = FILE_STATUS.ACTIVE;
      child.deleted_at = null;
      child.updated_at = new Date();
      await fileRepository.save(child);
      restoredCount++;

      // 如果子项是文件夹，递归恢复其子项
      if (child.is_folder) {
        restoredCount += await this.recursiveRestore(child.id, userId);
      }

      logger.info(`递归恢复子项: ${child.name} (${child.id})`);
    }

    return restoredCount;
  }
}
