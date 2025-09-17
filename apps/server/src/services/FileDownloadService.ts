import * as fs from 'fs/promises';
import { Context } from 'koa';

import { File } from '../entities/File';
import logger from '../utils/logger';

/**
 * 文件下载服务 - 统一处理文件下载相关逻辑
 */
export class FileDownloadService {
  /**
   * 验证文件是否可以下载
   * @param file 文件实体
   * @returns 验证结果和错误信息
   */
  static async validateFileForDownload(file: File): Promise<{
    isValid: boolean;
    statusCode?: number;
    message?: string;
  }> {
    // 检查是否为文件夹
    if (file.is_folder) {
      return {
        isValid: false,
        statusCode: 400,
        message: '不能下载文件夹',
      };
    }

    // 检查物理文件是否存在
    try {
      await fs.access(file.path);
    } catch {
      return {
        isValid: false,
        statusCode: 404,
        message: '文件不存在于服务器上',
      };
    }

    return { isValid: true };
  }

  /**
   * 设置文件下载响应头
   * @param ctx Koa Context
   * @param file 文件实体
   */
  static setDownloadHeaders(ctx: Context, file: File): void {
    // 使用 RFC 6266 标准格式，支持中文文件名
    const encodedFilename = encodeURIComponent(file.name);
    ctx.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    ctx.set('Content-Type', file.type || 'application/octet-stream');
    ctx.set('Content-Length', file.size?.toString() || '0');
  }

  /**
   * 发送文件流
   * @param ctx Koa Context
   * @param file 文件实体
   */
  static async sendFileStream(ctx: Context, file: File): Promise<void> {
    const fileStream = await fs.readFile(file.path);
    ctx.body = fileStream;
  }

  /**
   * 统一的文件下载处理方法
   * @param ctx Koa Context
   * @param file 文件实体
   * @param downloadType 下载类型，用于日志记录
   * @param extraLogInfo 额外的日志信息
   */
  static async handleFileDownload(
    ctx: Context,
    file: File,
    downloadType: 'file' | 'share',
    extraLogInfo?: Record<string, any>
  ): Promise<void> {
    // 验证文件
    const validation = await this.validateFileForDownload(file);
    if (!validation.isValid) {
      ctx.status = validation.statusCode!;
      ctx.body = {
        code: validation.statusCode,
        message: validation.message,
      };
      return;
    }

    try {
      // 设置响应头
      this.setDownloadHeaders(ctx, file);

      // 发送文件流
      await this.sendFileStream(ctx, file);

      // 记录成功日志
      const logMessage =
        downloadType === 'file' ? `文件下载成功: ${file.name}` : `分享文件下载成功: ${file.name}`;

      logger.info(logMessage, {
        fileId: file.id,
        fileName: file.name,
        fileSize: file.size,
        downloadType,
        ...extraLogInfo,
      });
    } catch (error) {
      logger.error('文件下载流处理失败:', error);
      throw error;
    }
  }

  /**
   * 处理下载错误的统一方法
   * @param ctx Koa Context
   * @param error 错误对象
   * @param downloadType 下载类型
   */
  static handleDownloadError(ctx: Context, error: any, downloadType: 'file' | 'share'): void {
    const errorMessage = downloadType === 'file' ? '下载文件失败' : '下载分享文件失败';

    logger.error(`${errorMessage}:`, error);

    if (!ctx.headerSent) {
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: errorMessage,
      };
    }
  }
}
