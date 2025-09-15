import * as fs from 'fs/promises';
import { Context } from 'koa';
import * as path from 'path';

import { AppDataSource } from '../config/database';
import { FILE_STATUS } from '../constants/files';
import { DEFAULT_PAGE_SIZE } from '../constants/page';
import { File } from '../entities/File';
import { FileDeleteService } from '../services/FileDeleteService';
import { FileNameService } from '../services/FileNameService';
import { FileQueryHelper } from '../services/FileQueryHelper';
import { FileRecursiveService } from '../services/FileRecursiveService';
import { UserStorageService } from '../services/UserStorageService';
import { generateDownloadToken, verifyDownloadToken } from '../utils/downloadToken';
import logger from '../utils/logger';

export class FileController {
  private userStorageService: UserStorageService;

  constructor() {
    this.userStorageService = new UserStorageService();
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
      const queryBuilder = FileQueryHelper.getValidFilesQueryBuilder(userId);

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
            await FileDeleteService.permanentlyDeleteFile(file, 'FileController');

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
            // 移到回收站 - 也需要删除相关分享记录，因为用户期望删除文件后分享失效
            await FileDeleteService.deleteRelatedShares(file.id);

            // 如果是文件夹，递归删除所有子项的分享记录和标记删除
            if (file.is_folder) {
              await FileRecursiveService.recursiveDeleteShares(file.id, userId);
              await FileRecursiveService.recursiveMarkAsDeleted(file.id, userId);
            }

            file.status = FILE_STATUS.TRASH;
            file.deleted_at = new Date();
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
      const uniqueName = await FileNameService.generateUniqueFileName(
        name.trim(),
        parentId,
        userId
      );

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
      const uniqueName = await FileNameService.generateUniqueFileName(
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
      const { id } = ctx.params;
      const { token } = ctx.query;

      let userId: string;

      // 如果有token，使用token验证
      if (token) {
        try {
          const tokenPayload = verifyDownloadToken(token as string);
          logger.info(`File token验证成功: ${JSON.stringify(tokenPayload)}`);

          if (tokenPayload.type !== 'file' || tokenPayload.fileId !== id) {
            logger.error(
              `File token验证失败: type=${tokenPayload.type}, fileId=${tokenPayload.fileId}, expected=${id}`
            );
            ctx.status = 401;
            ctx.body = { code: 401, message: '无效的下载token' };
            return;
          }

          userId = tokenPayload.userId!;
        } catch (error) {
          logger.error(
            `File token验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          ctx.status = 401;
          ctx.body = { code: 401, message: '无效的下载token' };
          return;
        }
      } else {
        // 使用常规认证
        userId = ctx.state.auth?.sub;
        if (!userId) {
          throw new Error('未认证的用户');
        }
      }

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

  /**
   * 生成临时下载链接
   */
  async generateDownloadLink(ctx: Context) {
    try {
      const userId = ctx.state.auth?.sub;
      if (!userId) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '未授权的访问',
        };
        return;
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

      // 生成临时下载token
      const downloadToken = generateDownloadToken({
        type: 'file',
        fileId: id,
        userId: userId,
      });

      // 构建完整的下载链接
      const port = process.env.PORT || 3000;
      const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
      const downloadUrl = `${baseUrl}/api/files/${id}/download?token=${downloadToken}`;

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          downloadUrl,
          token: downloadToken,
          expiresIn: 3600, // 1小时，以秒为单位
          fileName: file.name,
          fileSize: file.size,
        },
      };

      logger.info(`生成文件临时下载链接成功: ${file.name}`, { userId, fileId: file.id });
    } catch (error) {
      logger.error('生成文件临时下载链接失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误',
      };
    }
  }
}
