import * as fs from 'fs/promises';
import { Context } from 'koa';
import * as path from 'path';
import { Not } from 'typeorm';

import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { DEFAULT_PAGE_SIZE } from '../constants/page';
import { File } from '../entities/File';
import { UserStorageService } from '../services/UserStorageService';
import logger from '../utils/logger';

export class FileController {
  private userStorageService: UserStorageService;

  constructor() {
    this.userStorageService = new UserStorageService();
  }

  /**
   * 生成唯一的文件名，如果存在重名则添加 (数字) 后缀
   */
  private async generateUniqueFileName(
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

  /**
   * 获取文件列表
   */
  async getFiles(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const {
        parentId = null,
        page = 1,
        pageSize = DEFAULT_PAGE_SIZE,
        sortBy = 'created_at',
        sortOrder = 'desc',
        searchKeyword = '',
        fileType = '',
      } = ctx.query;

      const fileRepository = AppDataSource.getRepository(File);
      const queryBuilder = fileRepository
        .createQueryBuilder('file')
        .where('file.user_id = :userId', { userId })
        .andWhere('file.status = :status', { status: FILE_STATUS.ACTIVE });

      // 父目录筛选
      if (parentId) {
        queryBuilder.andWhere('file.parent_id = :parentId', { parentId });
      } else {
        queryBuilder.andWhere('file.parent_id IS NULL');
      }

      // 搜索关键词
      if (searchKeyword) {
        queryBuilder.andWhere('file.name ILIKE :searchKeyword', {
          searchKeyword: `%${searchKeyword}%`,
        });
      }

      // 文件类型筛选
      if (fileType) {
        queryBuilder.andWhere('file.type LIKE :fileType', { fileType: `${fileType}%` });
      }

      // 排序
      const sortColumns = ['name', 'size', 'type', 'created_at', 'updated_at'];
      if (sortColumns.includes(sortBy as string)) {
        queryBuilder.orderBy(`file.${sortBy}`, sortOrder === 'asc' ? 'ASC' : 'DESC');
      }

      // 分页
      const pageNumber = parseInt(page as string) || 1;
      const pageSizeNumber = parseInt(pageSize as string) || DEFAULT_PAGE_SIZE;
      const offset = (pageNumber - 1) * pageSizeNumber;

      const [files, total] = await queryBuilder.skip(offset).take(pageSizeNumber).getManyAndCount();

      // 构建当前路径信息
      let currentPath = '/';
      if (parentId) {
        const parentFile = await fileRepository.findOne({
          where: { id: parentId as string, user_id: userId },
        });
        if (parentFile) {
          currentPath = parentFile.path;
        }
      }

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          files: files.map(file => ({
            id: file.id,
            parentId: file.parent_id,
            name: file.name,
            size: parseInt(file.size?.toString() || '0'),
            type: file.type,
            isFolder: file.is_folder,
            path: file.path,
            md5: file.md5,
            status: file.status,
            createdAt: file.created_at,
            updatedAt: file.updated_at,
          })),
          pagination: {
            page: pageNumber,
            pageSize: pageSizeNumber,
            total,
            totalPages: Math.ceil(total / pageSizeNumber),
          },
          currentPath,
        },
      };
    } catch (error) {
      logger.error('获取文件列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取文件列表失败',
      };
    }
  }

  /**
   * 删除文件/文件夹
   */
  async deleteFiles(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const { ids, permanent = false } = (ctx.request as any).body as {
        ids: string[];
        permanent?: boolean;
      };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '请提供要删除的文件ID列表',
        };
        return;
      }

      const fileRepository = AppDataSource.getRepository(File);
      const deletedItems: Array<{ id: string; name: string; type: string; size: number }> = [];
      const failedIds: string[] = [];
      let totalDeletedSize = 0n;

      for (const fileId of ids) {
        try {
          const file = await fileRepository.findOne({
            where: { id: fileId, user_id: userId },
          });

          if (!file) {
            failedIds.push(fileId);
            continue;
          }

          if (permanent || file.status === FILE_STATUS.TRASH) {
            // 永久删除
            await this.permanentlyDeleteFile(file);
            await fileRepository.remove(file);

            // 如果是文件（非文件夹），计算大小变化
            if (!file.is_folder && file.size) {
              totalDeletedSize += BigInt(file.size);
            }

            deletedItems.push({
              id: file.id,
              name: file.name,
              type: file.is_folder ? 'folder' : 'file',
              size: parseInt(file.size?.toString() || '0'),
            });
          } else {
            // 移到回收站
            file.status = FILE_STATUS.TRASH;
            file.updated_at = new Date();
            await fileRepository.save(file);

            deletedItems.push({
              id: file.id,
              name: file.name,
              type: file.is_folder ? 'folder' : 'file',
              size: parseInt(file.size?.toString() || '0'),
            });
          }
        } catch (error) {
          logger.error(`删除文件失败: ${fileId}`, error);
          failedIds.push(fileId);
        }
      }

      // 更新用户存储空间（仅在永久删除时）
      if (permanent && totalDeletedSize > 0n) {
        await this.userStorageService.updateUsedSpace(userId, -totalDeletedSize);
      }

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          deletedCount: deletedItems.length,
          failedIds,
          deletedItems,
        },
      };
    } catch (error) {
      logger.error('删除文件失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '删除文件失败',
      };
    }
  }

  /**
   * 永久删除文件的物理文件
   */
  private async permanentlyDeleteFile(file: File) {
    try {
      if (!file.is_folder && file.path) {
        // 检查是否有其他用户引用同一个物理文件
        const fileRepository = AppDataSource.getRepository(File);
        const otherReferences = await fileRepository.count({
          where: {
            md5: file.md5,
            status: FILE_STATUS.ACTIVE,
          },
        });

        // 如果没有其他用户引用，则删除物理文件
        if (otherReferences <= 1) {
          await fs.unlink(file.path);
          logger.info(`物理文件已删除: ${file.path}`);
        } else {
          logger.info(`物理文件被其他用户引用，保留文件: ${file.path}`);
        }
      }
    } catch (error) {
      logger.error(`删除物理文件失败: ${file.path}`, error);
    }
  }

  /**
   * 创建文件夹
   */
  async createFolder(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const { name, parentId = null } = (ctx.request as any).body as {
        name: string;
        parentId?: string;
      };

      if (!name || !name.trim()) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '文件夹名称不能为空',
        };
        return;
      }

      const fileRepository = AppDataSource.getRepository(File);

      // 生成唯一的文件夹名称（如果重名则自动添加数字后缀）
      const uniqueName = await this.generateUniqueFileName(name.trim(), parentId, userId);

      // 构建路径
      let folderPath = '/';
      if (parentId) {
        const parentFolder = await fileRepository.findOne({
          where: { id: parentId, user_id: userId, is_folder: true },
        });
        if (!parentFolder) {
          ctx.status = 400;
          ctx.body = {
            code: 400,
            message: '父文件夹不存在',
          };
          return;
        }
        folderPath = path.join(parentFolder.path, uniqueName);
      } else {
        folderPath = `/${uniqueName}`;
      }

      // 创建文件夹记录
      const newFolder = fileRepository.create({
        name: uniqueName,
        path: folderPath,
        size: 0,
        type: 'folder',
        is_folder: true,
        user_id: userId,
        status: FILE_STATUS.ACTIVE,
        parent_id: parentId,
      });

      const savedFolder = await fileRepository.save(newFolder);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          id: savedFolder.id,
          name: savedFolder.name,
          parentId: savedFolder.parent_id,
          path: savedFolder.path,
          isFolder: savedFolder.is_folder,
          createdAt: savedFolder.created_at,
          updatedAt: savedFolder.updated_at,
        },
      };
    } catch (error) {
      logger.error('创建文件夹失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '创建文件夹失败',
      };
    }
  }

  /**
   * 重命名文件/文件夹
   */
  async renameFile(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const { id } = ctx.params;
      const { name } = (ctx.request as any).body as { name: string };

      if (!name || !name.trim()) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '文件名不能为空',
        };
        return;
      }

      const fileRepository = AppDataSource.getRepository(File);
      const file = await fileRepository.findOne({
        where: { id, user_id: userId },
      });

      if (!file) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '文件不存在',
        };
        return;
      }

      // 生成唯一的文件名称（如果重名则自动添加数字后缀）
      const uniqueName = await this.generateUniqueFileName(
        name.trim(),
        file.parent_id,
        userId,
        file.id
      );

      // 更新文件名
      const oldName = file.name;
      file.name = uniqueName;
      file.updated_at = new Date();

      // 对于物理文件，不需要重命名物理文件，因为文件存储路径基于文件ID
      // 只有文件夹才需要更新路径信息，因为它们没有物理文件

      await fileRepository.save(file);

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          id: file.id,
          name: file.name,
          path: file.path,
          updatedAt: file.updated_at,
        },
      };

      logger.info(`文件重命名成功: ${oldName} -> ${file.name}`, { userId, fileId: file.id });
    } catch (error) {
      logger.error('重命名文件失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '重命名文件失败',
      };
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        throw new Error('未认证的用户');
      }

      const { id } = ctx.params;
      const fileRepository = AppDataSource.getRepository(File);

      const file = await fileRepository.findOne({
        where: { id, user_id: userId, status: FILE_STATUS.ACTIVE },
      });

      if (!file) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '文件不存在',
        };
        return;
      }

      if (file.is_folder) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '不能下载文件夹',
        };
        return;
      }

      // 检查物理文件是否存在
      try {
        await fs.access(file.path);
      } catch {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '文件不存在于服务器上',
        };
        return;
      }

      // 设置下载响应头
      // 使用 RFC 6266 标准格式，支持中文文件名
      const encodedFilename = encodeURIComponent(file.name);
      ctx.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      ctx.set('Content-Type', file.type || 'application/octet-stream');
      ctx.set('Content-Length', file.size?.toString() || '0');

      // 创建文件流并响应
      const fileStream = await fs.readFile(file.path);
      ctx.body = fileStream;

      logger.info(`文件下载成功: ${file.name}`, { userId, fileId: file.id });
    } catch (error) {
      logger.error('下载文件失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '下载文件失败',
      };
    }
  }

  /**
   * 获取文件夹的面包屑路径
   */
  async getFolderPath(ctx: Context) {
    const userId = ctx.state.auth?.sub;
    const { id } = ctx.params;

    if (!userId) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: '未授权的访问',
      };
      return;
    }

    try {
      const fileRepository = AppDataSource.getRepository(File);
      const pathItems: Array<{ id: string; name: string }> = [];

      // 获取目标文件夹
      const targetFolder = await fileRepository.findOne({
        where: {
          id,
          user_id: userId,
          is_folder: true,
          status: FILE_STATUS.ACTIVE,
        },
      });

      if (!targetFolder) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '文件夹不存在',
        };
        return;
      }

      // 递归构建路径
      const buildPath = async (folderId: string | null): Promise<void> => {
        if (!folderId) return;

        const folder = await fileRepository.findOne({
          where: {
            id: folderId,
            user_id: userId,
            is_folder: true,
            status: FILE_STATUS.ACTIVE,
          },
        });

        if (folder) {
          // 先递归处理父文件夹
          await buildPath(folder.parent_id);
          // 然后添加当前文件夹
          pathItems.push({
            id: folder.id,
            name: folder.name,
          });
        }
      };

      // 添加根目录
      pathItems.push({ id: 'root', name: '根目录' });

      // 构建完整路径
      await buildPath(id);

      ctx.body = {
        code: 200,
        message: '获取路径成功',
        data: {
          path: pathItems,
        },
      };

      logger.info(`获取文件夹路径成功: ${targetFolder.name}`, { userId, folderId: id });
    } catch (error) {
      logger.error('获取文件夹路径失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取文件夹路径失败',
      };
    }
  }
}
