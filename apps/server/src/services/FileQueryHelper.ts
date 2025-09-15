import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { File } from '../entities/File';

/**
 * 文件查询助手 - 提供排除已删除父路径的查询功能
 */
export class FileQueryHelper {
  /**
   * 获取排除已删除父路径的文件查询构建器
   */
  static getValidFilesQueryBuilder(userId: string, baseStatus: string = FILE_STATUS.ACTIVE) {
    const fileRepository = AppDataSource.getRepository(File);

    return fileRepository
      .createQueryBuilder('file')
      .where('file.user_id = :userId', { userId })
      .andWhere('file.status = :status', { status: baseStatus })
      .andWhere(qb => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from(File, 'parent')
          .where('parent.id = file.parent_id')
          .andWhere('parent.status = :trashStatus', { trashStatus: FILE_STATUS.TRASH })
          .getQuery();
        return `NOT EXISTS (${subQuery})`;
      });
  }

  /**
   * 递归检查文件路径是否包含已删除的父文件夹
   */
  static async hasDeletedParent(fileId: string, userId: string): Promise<boolean> {
    const fileRepository = AppDataSource.getRepository(File);

    const file = await fileRepository.findOne({
      where: { id: fileId, user_id: userId },
    });

    if (!file || !file.parent_id) {
      return false;
    }

    const parent = await fileRepository.findOne({
      where: { id: file.parent_id, user_id: userId },
    });

    if (!parent) {
      return true; // 父文件夹不存在
    }

    if (parent.status === FILE_STATUS.TRASH) {
      return true; // 父文件夹已删除
    }

    // 递归检查上级
    return await this.hasDeletedParent(parent.id, userId);
  }
}
