import { Context } from 'koa';

import { AppDataSource } from '../config/database';
import { File } from '../entities/File';
import { ChunkUploadResponse, HandshakeRequest, HandshakeResponse } from '../types/upload';
import {
  cleanupUpload,
  ensureDir,
  getChunkDir,
  mergeFileChunks,
  readUploadStatusFile,
  removeUploadStatus,
  writeUploadStatusFile,
} from '../utils/file';
import logger from '../utils/logger';

/**
 * 处理上传握手请求
 */
export const handleHandshake = async (ctx: Context): Promise<void> => {
  const {
    fileHash,
    chunkHashes,
    filename,
    fileSize,
    fileExtension,
    mimeType,
    parentId = null,
  } = (ctx.request as any).body as HandshakeRequest;

  // 获取认证用户ID
  const userId = ctx.state.auth?.sub;
  if (!userId) {
    throw new Error('未认证的用户');
  }

  logger.info(`文件握手请求开始处理: ${filename} (${fileHash})`, {
    fileSize,
    chunksCount: chunkHashes.length,
    userId,
  });

  // 检查文件是否已存在，如果是当前用户已经上传过，显示文件已上传过，如果是其他用户上传过，显示文件已秒传
  const fileRepository = AppDataSource.getRepository(File);
  const existingFile = await fileRepository.findOne({
    where: { md5: fileHash },
  });

  if (existingFile) {
    // 检查是否为当前用户自己上传的文件
    if (existingFile.user_id === userId) {
      // 如果是当前用户自己的文件，直接返回结果，不添加新记录
      logger.info(`文件已存在，当前用户已上传: ${filename} (${fileHash})`, {
        fileId: existingFile.id,
        userId,
      });

      ctx.body = {
        code: 200,
        message: '您已上传过此文件',
        data: {
          hasUploaded: true,
          chunks: [],
          fileId: existingFile.id,
        } as HandshakeResponse,
      };
      return;
    } else {
      // 如果是其他用户上传的文件，创建新的文件记录（复制）
      const newFile = fileRepository.create({
        name: filename,
        path: existingFile.path, // 使用同一物理文件
        size: fileSize,
        type: mimeType || 'application/octet-stream', // 使用前端传递的MIME类型
        is_folder: false,
        user_id: userId,
        status: 'active',
        md5: fileHash,
        parent_id: parentId,
      });

      const savedFile = await fileRepository.save(newFile);

      logger.info(`文件秒传成功: ${filename} (${fileHash})`, {
        fileId: savedFile.id,
        userId,
      });

      ctx.body = {
        code: 200,
        message: '文件已秒传',
        data: {
          hasUploaded: true,
          chunks: [],
          fileId: savedFile.id,
        } as HandshakeResponse,
      };
      return;
    }
  }

  // 检查是否有部分上传的状态文件
  let statusFile = await readUploadStatusFile(fileHash);

  // 如果没有状态文件，创建新的
  if (!statusFile) {
    statusFile = {
      filename,
      fileHash,
      fileSize,
      fileExtension,
      mimeType,
      uploadedChunks: [],
      allChunks: chunkHashes,
      userId,
      parentId,
      createdAt: new Date().toISOString(),
    };

    logger.info(`创建新的上传会话: ${filename} (${fileHash})`);

    // 确保分片目录存在
    await ensureDir(getChunkDir(fileHash));
  } else {
    // 如果已经有状态文件，更新它
    statusFile.updatedAt = new Date().toISOString();
    logger.info(`继续已有上传会话: ${filename} (${fileHash})`, {
      uploadedChunks: statusFile.uploadedChunks.length,
    });
  }

  // 找出哪些分片需要上传
  // 基于状态文件中的 uploadedChunks 来判断哪些分片还需要上传
  const chunksToUpload = [];
  for (const chunkHash of chunkHashes) {
    if (!statusFile.uploadedChunks.includes(chunkHash)) {
      chunksToUpload.push(chunkHash);
    }
  }

  // 保存更新后的状态文件
  await writeUploadStatusFile(fileHash, statusFile);

  logger.info(`文件握手成功: ${filename} (${fileHash})`, {
    chunksToUpload: chunksToUpload.length,
    totalChunks: chunkHashes.length,
  });

  ctx.body = {
    code: 200,
    message: '握手成功',
    data: {
      hasUploaded: false,
      chunks: chunksToUpload,
    } as HandshakeResponse,
  };
};

/**
 * 处理分片上传
 */
export const handleChunkUpload = async (ctx: Context): Promise<void> => {
  // 从请求中获取参数
  const fileHash = ctx.query.fileHash as string;
  const chunkHash = ctx.query.chunkHash as string;

  logger.info(`处理分片上传，参数: fileHash=${fileHash}, chunkHash=${chunkHash}`);

  // 验证参数
  if (!fileHash) {
    logger.warn(`缺少必要参数: fileHash`);
    ctx.status = 400;
    ctx.body = { code: 400, message: '缺少必要参数：fileHash', data: null };
    return;
  }

  if (!chunkHash) {
    logger.warn(`缺少必要参数: chunkHash`);
    ctx.status = 400;
    ctx.body = { code: 400, message: '缺少必要参数：chunkHash', data: null };
    return;
  }

  // 获取认证用户ID
  const userId = ctx.state.auth?.sub;

  logger.info(`处理分片上传: ${chunkHash} (文件哈希: ${fileHash})`, { userId });

  // 读取上传状态
  const statusFile = await readUploadStatusFile(fileHash);
  if (!statusFile) {
    logger.warn(`无效的上传会话: ${fileHash}`, { chunkHash });
    ctx.status = 400;
    ctx.body = { code: 400, message: '无效的上传会话，请重新开始上传', data: null };
    return;
  }

  // 更新已上传分片列表
  if (!statusFile.uploadedChunks.includes(chunkHash)) {
    statusFile.uploadedChunks.push(chunkHash);
  }

  // 更新状态文件
  statusFile.updatedAt = new Date().toISOString();
  await writeUploadStatusFile(fileHash, statusFile);

  // 计算剩余分片
  const remainingChunks = statusFile.allChunks.filter(
    chunk => !statusFile.uploadedChunks.includes(chunk)
  );

  // 构建响应数据
  const responseData: ChunkUploadResponse = {
    uploadSuccess: true,
    remainingChunks,
    completed: remainingChunks.length === 0,
    progress: {
      uploaded: statusFile.uploadedChunks.length,
      total: statusFile.allChunks.length,
      percentage: (statusFile.uploadedChunks.length / statusFile.allChunks.length) * 100,
    },
  };

  logger.info(`分片上传进度: ${responseData.progress.percentage.toFixed(2)}%`, {
    fileHash,
    uploaded: responseData.progress.uploaded,
    total: responseData.progress.total,
  });

  // 如果所有分片都已上传，则合并文件
  if (responseData.completed) {
    logger.info(`所有分片已上传，开始合并文件: ${statusFile.filename} (${fileHash})`);

    // 创建文件记录
    const fileRepository = AppDataSource.getRepository(File);
    const newFile = fileRepository.create({
      name: statusFile.filename,
      path: '', // 临时路径，将在合并后更新
      size: statusFile.fileSize,
      type: statusFile.mimeType || 'application/octet-stream', // 使用前端传递的MIME类型
      is_folder: false,
      user_id: userId,
      status: 'active',
      md5: fileHash,
      parent_id: statusFile.parentId || null,
    });

    const savedFile = await fileRepository.save(newFile);
    logger.info(`文件记录已创建: ID ${savedFile.id}`);

    // 合并文件分片
    const finalPath = await mergeFileChunks(fileHash, userId, savedFile.id, statusFile.filename);
    logger.info(`文件分片合并成功: ${finalPath}`);

    // 更新文件路径
    savedFile.path = finalPath;
    await fileRepository.save(savedFile);

    // 清理临时文件
    await cleanupUpload(fileHash);
    logger.info(`临时文件清理完成: ${fileHash}`);

    // 返回文件ID
    responseData.fileId = savedFile.id;
  }

  ctx.body = {
    code: 200,
    message: responseData.completed ? '文件上传完成' : '分片上传成功',
    data: responseData,
  };
};

/**
 * 处理取消上传请求
 */
export const handleCancelUpload = async (ctx: Context): Promise<void> => {
  const { fileHash } = (ctx.request as any).body;

  // 验证参数
  if (!fileHash) {
    logger.warn('缺少必要参数: fileHash');
    ctx.status = 400;
    ctx.body = { code: 400, message: '缺少必要参数：fileHash', data: null };
    return;
  }

  // 获取认证用户ID
  const userId = ctx.state.auth?.sub;

  logger.info(`处理取消上传请求: ${fileHash}`, { userId });

  // 读取上传状态，检查是否存在，但我们不检查用户权限
  // 这允许系统管理员在必要时取消任何上传
  await readUploadStatusFile(fileHash);

  // 尝试删除上传状态和分片文件
  // 即使没有状态文件也尝试删除，这样可以处理意外情况下的清理工作
  const success = await removeUploadStatus(fileHash);

  if (success) {
    logger.info(`上传取消成功: ${fileHash}`, { userId });
    ctx.body = { code: 200, message: '上传已取消', data: { success: true } };
  } else {
    logger.error(`上传取消失败: ${fileHash}`, { userId });
    ctx.body = { code: 500, message: '取消上传失败', data: { success: false } };
  }
};
