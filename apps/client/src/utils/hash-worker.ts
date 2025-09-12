/**
 * hash-worker 工具类的包装器，提供更高级别的接口
 */
import type { HashWorkerOptions, HashWorkerResult, Strategy } from 'hash-worker';
import { destroyWorkerPool, getFileHashChunks } from 'hash-worker';

/**
 * 文件哈希计算配置
 */
export interface HashConfig {
  /** 分片大小，单位MB */
  chunkSize?: number;
  /** 并行工作线程数 */
  workerCount?: number;
  /** 哈希算法 */
  strategy?: 'md5' | 'sha1' | 'sha256';
}

/**
 * 文件哈希计算结果
 */
export interface HashResult {
  /** 文件的整体哈希值 */
  fileHash: string;
  /** 各个分片的哈希值数组 */
  chunkHashes: string[];
  /** 分片的Blob对象数组 */
  chunks: Blob[];
  /** 分片总数 */
  chunkCount: number;
}

/**
 * 计算文件哈希值和分片
 * @param file 要计算哈希的文件
 * @param config 配置选项
 * @returns 文件哈希结果
 */
export async function calculateFileHashAndChunks(
  file: File,
  config?: HashConfig
): Promise<HashResult> {
  const options: HashWorkerOptions = {
    file,
    config: {
      chunkSize: config?.chunkSize || 5, // 默认5MB
      workerCount: config?.workerCount || 4,
      strategy: (config?.strategy as unknown as Strategy) || ('md5' as unknown as Strategy),
    },
  };

  try {
    // 调用hash-worker库计算哈希
    const result: HashWorkerResult = await getFileHashChunks(options);

    // 处理结果并返回
    return {
      fileHash: result.merkleHash,
      chunkHashes: result.chunksHash,
      chunks: result.chunksBlob || [],
      chunkCount: result.chunksBlob?.length || 0,
    };
  } finally {
    // 确保Worker池被清理
    destroyWorkerPool();
  }
}

/**
 * 计算文件哈希（不包含分片）
 * @param file 要计算哈希的文件
 * @param config 配置选项
 * @returns 文件哈希值
 */
export async function calculateFileHash(file: File, config?: HashConfig): Promise<string> {
  const result = await calculateFileHashAndChunks(file, config);
  return result.fileHash;
}

/**
 * 将文件分片，便于大文件上传
 * @param file 要分片的文件
 * @param chunkSize 分片大小（MB）
 * @returns 分片数组
 */
export function chunkFile(file: File, chunkSize: number = 5): Blob[] {
  const chunks: Blob[] = [];
  const chunkSizeBytes = chunkSize * 1024 * 1024;
  let currentChunk = 0;

  while (currentChunk * chunkSizeBytes < file.size) {
    const start = currentChunk * chunkSizeBytes;
    const end = Math.min(start + chunkSizeBytes, file.size);
    chunks.push(file.slice(start, end));
    currentChunk++;
  }

  return chunks;
}
