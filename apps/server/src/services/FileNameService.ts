import { Not } from 'typeorm';

import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { File } from '../entities/File';

/**
 * 文件名服务 - 处理文件名重复和唯一性逻辑
 */
export class FileNameService {
  /**
   * 生成唯一的文件名，如果存在重名则添加 (数字) 后缀
   */
  static async generateUniqueFileName(
    originalName: string,
    parentId: string | null,
    userId: string,
    excludeId?: string
  ): Promise<string> {
    const fileRepository = AppDataSource.getRepository(File);

    // 构建查询条件
    let queryBuilder = fileRepository
      .createQueryBuilder('file')
      .where('file.name = :name', { name: originalName })
      .andWhere('file.user_id = :userId', { userId })
      .andWhere('file.status = :status', { status: FILE_STATUS.ACTIVE });

    if (parentId) {
      queryBuilder = queryBuilder.andWhere('file.parent_id = :parentId', { parentId });
    } else {
      queryBuilder = queryBuilder.andWhere('file.parent_id IS NULL');
    }

    // 如果提供了 excludeId，排除该 ID
    if (excludeId) {
      queryBuilder = queryBuilder.andWhere('file.id != :excludeId', { excludeId });
    }

    // 检查原名是否可用
    const existingFile = await queryBuilder.getOne();

    if (!existingFile) {
      return originalName;
    }

    // 如果存在重名，生成带数字后缀的文件名
    const nameWithoutExt = originalName.includes('.')
      ? originalName.substring(0, originalName.lastIndexOf('.'))
      : originalName;
    const extension = originalName.includes('.')
      ? originalName.substring(originalName.lastIndexOf('.'))
      : '';

    let counter = 1;
    let newName: string;

    do {
      newName = `${nameWithoutExt}(${counter})${extension}`;

      const conflictWhereCondition: any = {
        name: newName,
        parent_id: parentId,
        user_id: userId,
        status: FILE_STATUS.ACTIVE,
      };

      if (excludeId) {
        conflictWhereCondition.id = Not(excludeId);
      }

      const conflictFile = await fileRepository.findOne({
        where: conflictWhereCondition,
      });

      if (!conflictFile) {
        break;
      }

      counter++;
    } while (counter < 1000); // 防止无限循环，最多尝试1000次

    return newName;
  }
}
