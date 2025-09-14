import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { File } from '../entities/File';
import logger from '../utils/logger';

/**
 * 文件路径服务 - 处理文件路径和层级关系
 */
export class FilePathService {
  /**
   * 检查文件是否在有效的路径中（父路径没有被删除的文件夹）
   */
  static async isFileInValidPath(fileId: string, userId: string): Promise<boolean> {
    try {
      const fileRepository = AppDataSource.getRepository(File);

      // 获取文件信息
      const file = await fileRepository.findOne({
        where: { id: fileId, user_id: userId },
      });

      if (!file) {
        return false;
      }

      // 如果是根目录文件，直接返回true
      if (!file.parent_id) {
        return true;
      }

      // 递归检查父路径
      return await this.checkParentPathValid(file.parent_id, userId);
    } catch (error) {
      logger.error(`检查文件路径有效性失败: ${fileId}`, error);
      return false;
    }
  }

  /**
   * 递归检查父路径是否有效（没有被删除的文件夹）
   */
  private static async checkParentPathValid(parentId: string, userId: string): Promise<boolean> {
    const fileRepository = AppDataSource.getRepository(File);

    const parent = await fileRepository.findOne({
      where: { id: parentId, user_id: userId },
    });

    if (!parent) {
      return false;
    }

    // 如果父文件夹被删除，路径无效
    if (parent.status === FILE_STATUS.TRASH) {
      return false;
    }

    // 如果是根目录，路径有效
    if (!parent.parent_id) {
      return true;
    }

    // 递归检查上级路径
    return await this.checkParentPathValid(parent.parent_id, userId);
  }

  /**
   * 获取文件的所有有效子项（排除父路径已删除的项目）
   */
  static async getValidFiles(
    userId: string,
    parentId: string | null = null,
    status: string = FILE_STATUS.ACTIVE
  ) {
    const fileRepository = AppDataSource.getRepository(File);

    // 获取直接子项
    const files = await fileRepository.find({
      where: {
        user_id: userId,
        parent_id: parentId,
        status: status,
      },
      order: {
        is_folder: 'DESC', // 文件夹在前
        created_at: 'DESC',
      },
    });

    // 如果是根目录查询，直接返回
    if (!parentId) {
      return files;
    }

    // 检查父目录是否有效
    const isParentValid = await this.isFileInValidPath(parentId, userId);
    if (!isParentValid) {
      return [];
    }

    return files;
  }

  /**
   * 创建缺失的父文件夹路径
   */
  static async createMissingParentFolder(
    originalParentId: string,
    userId: string,
    originalFolderName?: string
  ): Promise<string> {
    const fileRepository = AppDataSource.getRepository(File);

    // 尝试获取原始父文件夹信息
    const originalParent = await fileRepository.findOne({
      where: { id: originalParentId, user_id: userId },
    });

    const folderName = originalFolderName || originalParent?.name || '已恢复的文件夹';

    // 创建新的文件夹
    const newFolder = fileRepository.create({
      name: folderName,
      is_folder: true,
      parent_id: null, // 创建在根目录
      user_id: userId,
      status: FILE_STATUS.ACTIVE,
      path: `/${folderName}`,
      size: 0,
      type: 'folder',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedFolder = await fileRepository.save(newFolder);
    logger.info(`为恢复文件创建了新文件夹: ${folderName} (ID: ${savedFolder.id})`);

    return savedFolder.id;
  }
}
