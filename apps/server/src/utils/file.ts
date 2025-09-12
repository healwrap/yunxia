import fs from 'fs';
import path from 'path';

import { UploadStatusFile } from '../types/upload';
import logger from './logger';

// 存储根目录
const STORAGE_ROOT = path.resolve(process.cwd(), 'uploads');
// 临时分片存储目录
const TEMP_CHUNKS_DIR = path.resolve(STORAGE_ROOT, 'temp', 'chunks');
// 用户文件存储目录
const USERS_FILES_DIR = path.resolve(STORAGE_ROOT, 'users');

// 确保目录存在
export const ensureDir = async (dirPath: string): Promise<void> => {
  try {
    await fs.promises.access(dirPath);
  } catch {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
};

// 初始化存储目录
export const initializeStorage = async (): Promise<void> => {
  await ensureDir(STORAGE_ROOT);
  await ensureDir(TEMP_CHUNKS_DIR);
  await ensureDir(USERS_FILES_DIR);
};

// 获取文件上传状态文件路径
export const getUploadStatusFilePath = (fileHash: string): string => {
  return path.join(STORAGE_ROOT, 'temp', `${fileHash}.json`);
};

// 获取分片存储目录
export const getChunkDir = (fileHash: string): string => {
  return path.join(TEMP_CHUNKS_DIR, fileHash);
};

// 获取分片文件路径
export const getChunkPath = (fileHash: string, chunkHash: string): string => {
  const chunkDir = getChunkDir(fileHash);
  return path.join(chunkDir, chunkHash);
};

// 获取最终文件存储路径
export const getUserFilePath = (userId: string, fileId: string, filename: string): string => {
  const userDir = path.join(USERS_FILES_DIR, userId);
  return path.join(userDir, `${fileId}__${filename}`);
};

// 读取上传状态文件
export const readUploadStatusFile = async (fileHash: string): Promise<UploadStatusFile | null> => {
  const statusFilePath = getUploadStatusFilePath(fileHash);
  try {
    const content = await fs.promises.readFile(statusFilePath, 'utf-8');
    return JSON.parse(content) as UploadStatusFile;
  } catch {
    return null;
  }
};

// 写入上传状态文件
export const writeUploadStatusFile = async (
  fileHash: string,
  data: UploadStatusFile
): Promise<void> => {
  if (!data) {
    throw new Error('上传状态数据(data)不能为空');
  }
  const statusFilePath = getUploadStatusFilePath(fileHash);
  await fs.promises.writeFile(statusFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

// 检查分片是否存在
export const checkChunkExists = async (fileHash: string, chunkHash: string): Promise<boolean> => {
  const chunkPath = getChunkPath(fileHash, chunkHash);
  try {
    await fs.promises.access(chunkPath);
    return true;
  } catch {
    return false;
  }
};

// 合并文件分片
export const mergeFileChunks = async (
  fileHash: string,
  userId: string,
  fileId: string,
  filename: string
): Promise<string> => {
  const chunkDir = getChunkDir(fileHash);
  const targetPath = getUserFilePath(userId, fileId, filename);

  // 确保用户目录存在
  await ensureDir(path.dirname(targetPath));

  // 读取上传状态文件获取正确的分片顺序
  const statusFile = await readUploadStatusFile(fileHash);
  if (!statusFile) {
    throw new Error(`无法找到上传状态文件: ${fileHash}`);
  }

  // 使用正确的分片顺序
  const orderedChunkHashes = statusFile.allChunks;

  logger.info(`开始合并文件分片，共 ${orderedChunkHashes.length} 个分片`, {
    fileHash,
    filename,
    targetPath,
  });

  // 验证所有分片都存在，并获取分片信息
  const chunkInfos = [];
  let totalSize = 0;

  for (let i = 0; i < orderedChunkHashes.length; i++) {
    const chunkHash = orderedChunkHashes[i];
    const chunkPath = path.join(chunkDir, chunkHash);

    try {
      const chunkStat = await fs.promises.stat(chunkPath);
      chunkInfos.push({
        hash: chunkHash,
        path: chunkPath,
        size: chunkStat.size,
        index: i,
      });
      totalSize += chunkStat.size;
    } catch (error) {
      logger.error(`分片文件不存在或无法访问: ${chunkPath}`, error);
      throw new Error(`分片文件不存在: ${chunkHash} (索引: ${i})`);
    }
  }

  logger.info(`分片验证完成，总大小: ${totalSize} 字节`);

  // 使用同步方式合并文件以确保顺序和完整性
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(targetPath);
    let currentIndex = 0;

    const processNextChunk = async () => {
      if (currentIndex >= chunkInfos.length) {
        // 所有分片处理完成
        writeStream.end();
        return;
      }

      const chunkInfo = chunkInfos[currentIndex];

      try {
        logger.info(`处理分片 ${currentIndex + 1}/${chunkInfos.length}: ${chunkInfo.hash}`, {
          size: chunkInfo.size,
        });

        const chunkBuffer = await fs.promises.readFile(chunkInfo.path);

        // 验证读取的数据大小
        if (chunkBuffer.length !== chunkInfo.size) {
          throw new Error(
            `分片 ${chunkInfo.hash} 读取大小不匹配，期望: ${chunkInfo.size}, 实际: ${chunkBuffer.length}`
          );
        }

        // 写入数据并等待完成
        const writeSuccess = writeStream.write(chunkBuffer);

        if (!writeSuccess) {
          // 等待 drain 事件
          writeStream.once('drain', () => {
            currentIndex++;
            processNextChunk().catch(reject);
          });
        } else {
          currentIndex++;
          setImmediate(() => {
            processNextChunk().catch(reject);
          });
        }

        // 删除已处理的分片文件
        await fs.promises.unlink(chunkInfo.path);
      } catch (error) {
        logger.error(`处理分片 ${chunkInfo.hash} 时出错`, error);
        writeStream.destroy();
        reject(error);
      }
    };

    writeStream.on('finish', async () => {
      try {
        // 验证最终文件大小
        const finalStat = await fs.promises.stat(targetPath);

        if (finalStat.size !== totalSize) {
          throw new Error(`最终文件大小不匹配，期望: ${totalSize}, 实际: ${finalStat.size}`);
        }

        logger.info(`文件合并完成，大小验证通过: ${finalStat.size} 字节`);

        // 删除分片目录
        try {
          await fs.promises.rmdir(chunkDir);
          logger.info(`分片目录清理完成: ${chunkDir}`);
        } catch (error) {
          logger.warn(`删除分片目录失败: ${chunkDir}`, error);
        }

        resolve(targetPath);
      } catch (error) {
        logger.error('文件合并后验证失败', error);
        reject(error);
      }
    });

    writeStream.on('error', error => {
      logger.error('写入流错误', error);
      reject(error);
    });

    // 开始处理第一个分片
    processNextChunk().catch(reject);
  });
};

// 清理上传状态和临时文件
export const cleanupUpload = async (fileHash: string): Promise<void> => {
  try {
    const statusFilePath = getUploadStatusFilePath(fileHash);
    await fs.promises.unlink(statusFilePath);
  } catch (error) {
    logger.error('Error cleaning up upload files:', error);
    // 即使清理失败也继续执行
  }
};

// 删除上传状态和分片
export const removeUploadStatus = async (fileHash: string): Promise<boolean> => {
  try {
    // 删除状态文件
    const statusFilePath = getUploadStatusFilePath(fileHash);
    try {
      await fs.promises.unlink(statusFilePath);
    } catch (error) {
      logger.warn(`删除上传状态文件失败: ${fileHash}`, error);
      // 继续尝试删除分片目录
    }

    // 删除分片目录及其内容
    const chunkDir = getChunkDir(fileHash);
    try {
      const chunkFiles = await fs.promises.readdir(chunkDir);

      // 删除所有分片文件
      for (const chunkFile of chunkFiles) {
        await fs.promises.unlink(path.join(chunkDir, chunkFile));
      }

      // 删除分片目录
      await fs.promises.rmdir(chunkDir);
    } catch (error) {
      logger.warn(`删除分片目录失败: ${fileHash}`, error);
      // 目录可能不存在，这是可以接受的
    }

    return true;
  } catch (error) {
    logger.error(`取消上传失败: ${fileHash}`, error);
    return false;
  }
};
