import { RcFile } from 'antd/es/upload';
import type { HashWorkerOptions, HashWorkerResult, Strategy } from 'hash-worker';
import { destroyWorkerPool, getFileHashChunks } from 'hash-worker';

import { uploadApi } from '../lib/api/upload';
import type { UploadTask } from '../store/uploadStore';

/**
 * 计算文件的哈希值和分片
 */
export const calculateFileHash = async (
  file: RcFile
): Promise<{ fileHash: string; chunkHashes: string[]; chunks: Blob[] }> => {
  try {
    const options: HashWorkerOptions = {
      file,
      config: {
        chunkSize: 10, // 10MB 的分片大小
        workerCount: navigator.hardwareConcurrency || 4,
        strategy: 'md5' as unknown as Strategy,
      },
    };

    const result: HashWorkerResult = await getFileHashChunks(options);

    // 完成后清理worker
    destroyWorkerPool();

    return {
      fileHash: result.merkleHash,
      chunkHashes: result.chunksHash,
      chunks: result.chunksBlob || [],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`计算文件哈希值失败: ${errorMessage}`);
  }
};

/**
 * 处理文件上传流程
 */
export const processFileUpload = async (
  task: UploadTask,
  updateTask: (updates: Partial<UploadTask>) => void,
  getTaskById: (id: string) => UploadTask | undefined,
  abortController: AbortController,
  parentId?: string // 添加父文件夹ID参数
) => {
  const taskId = task.id;

  try {
    // 检查任务是否还存在且状态正确
    const getCurrentTask = () => getTaskById(taskId);
    let currentTask = getCurrentTask();

    if (!currentTask || currentTask.status !== 'uploading') {
      return;
    }

    // 1. 发送握手请求
    const { data: handshakeResult } = await uploadApi.handshake(
      {
        fileHash: currentTask.fileHash,
        chunkHashes: currentTask.chunkHashes,
        filename: currentTask.file.name,
        fileSize: currentTask.file.size,
        fileExtension: currentTask.file.name.substring(currentTask.file.name.lastIndexOf('.')),
        mimeType: currentTask.file.type || 'application/octet-stream', // 使用文件对象的MIME类型
        parentId, // 传递父文件夹ID
      },
      abortController.signal
    );

    // 再次检查任务状态
    currentTask = getCurrentTask();
    if (!currentTask || currentTask.status !== 'uploading') {
      return;
    }

    // 2. 检查是否秒传
    if (handshakeResult.hasUploaded) {
      // 文件已秒传，直接更新任务状态为成功
      updateTask({
        status: 'success',
        progress: 100,
        fileId: handshakeResult.fileId,
        uploadedChunks: currentTask.totalChunks,
        remainingChunks: [],
      });
      return; // 重要：确保在秒传时直接返回，不继续后续处理
    }

    // 3. 获取需要上传的分片
    const chunksToUpload = handshakeResult.chunks || [];
    updateTask({
      remainingChunks: chunksToUpload,
    });

    // 4. 如果所有分片都已上传，但还未合并
    if (chunksToUpload.length === 0) {
      // 所有分片已上传，不需要额外操作，服务端应该已经完成合并
      // 这种情况通常发生在断点续传时
      updateTask({
        status: 'success',
        progress: 100,
        uploadedChunks: currentTask.totalChunks,
        remainingChunks: [],
      });
      return;
    }

    // 5. 上传需要的分片
    let uploadedChunks = currentTask.totalChunks - (chunksToUpload?.length || 0);
    updateTask({
      uploadedChunks,
      progress: Math.floor((uploadedChunks / (currentTask.totalChunks || 1)) * 100),
    });

    // 每个分片上传的处理函数
    const uploadChunk = async (chunkHash: string) => {
      // 实时检查任务状态
      const latestTask = getCurrentTask();
      if (!latestTask) {
        return { cancelled: true };
      }

      if (latestTask.status === 'paused') {
        return { paused: true };
      }

      if (latestTask.status !== 'uploading') {
        return { cancelled: true };
      }

      const chunkIndex = latestTask.chunkHashes.indexOf(chunkHash);
      if (chunkIndex === -1 || !latestTask.chunks || !latestTask.chunks[chunkIndex]) {
        return { error: new Error(`分片不存在: ${chunkHash}`) };
      }

      const chunk = latestTask.chunks[chunkIndex];
      try {
        const result = await uploadApi.uploadChunk(
          chunk,
          chunkHash,
          latestTask.fileHash,
          chunkIndex,
          abortController.signal
        );

        // 再次检查任务状态
        const taskAfterUpload = getCurrentTask();
        if (!taskAfterUpload || taskAfterUpload.status !== 'uploading') {
          return { cancelled: true };
        }

        uploadedChunks++;
        const progress = Math.floor((uploadedChunks / latestTask.totalChunks) * 100);

        updateTask({
          progress,
          uploadedChunks,
          remainingChunks: result.remainingChunks || [],
          status: result.completed ? 'success' : 'uploading',
          fileId: result.fileId || latestTask.fileId,
        });

        return { success: true, result };
      } catch (error) {
        // 如果是 AbortError，说明请求被主动取消
        if (error instanceof Error && error.name === 'AbortError') {
          return { cancelled: true };
        }
        return { error };
      }
    };

    // 串行处理每个分片，有控制地上传
    for (const chunkHash of chunksToUpload) {
      // 每次循环都检查任务状态
      currentTask = getCurrentTask();
      if (!currentTask || currentTask.status !== 'uploading') {
        // 如果任务不存在或不是上传状态，则停止上传
        break;
      }

      const result = await uploadChunk(chunkHash);

      if (result.paused) {
        // 任务已暂停，中断上传过程
        break;
      }

      if (result.cancelled) {
        // 任务已取消，中断上传过程
        break;
      }

      if (result.error) {
        // 在设置错误状态之前，再次检查任务当前状态
        const finalTask = getCurrentTask();
        if (finalTask && finalTask.status === 'paused') {
          // 如果任务已被暂停，不覆盖暂停状态
          break;
        }

        // 上传出错，更新任务状态
        updateTask({
          status: 'error',
          error: result.error as Error,
        });
        break;
      }

      // 如果任务已经完成
      if (result.success && result.result?.completed) {
        // 文件上传完成
        break;
      }
    }
  } catch (error) {
    // 如果是 AbortError，说明请求被主动取消（暂停或删除）
    if (error instanceof Error && error.name === 'AbortError') {
      // 检查任务当前状态，如果是 paused 就不更新，让 pauseTask 的状态保持
      const currentTask = getTaskById(taskId);
      if (currentTask && currentTask.status === 'paused') {
        return; // 保持暂停状态
      }
      // 如果任务已被删除或取消，也不需要更新状态
      return;
    }

    // 其他错误才设置为 error 状态
    updateTask({
      status: 'error',
      error: error as Error,
    });
  }
};

// 存储每个任务的 AbortController
const taskAbortControllers = new Map<string, AbortController>();

/**
 * 控制上传队列的并发
 */
export const processUploadQueue = async (
  tasks: UploadTask[],
  maxConcurrent: number,
  updateTask: (id: string, updates: Partial<UploadTask>) => void,
  getTaskById: (id: string) => UploadTask | undefined
) => {
  // 筛选等待中的任务
  const waitingTasks = tasks.filter(task => task.status === 'waiting');
  // 当前正在上传的任务数量
  const uploadingCount = tasks.filter(task => task.status === 'uploading').length;
  // 可以开始的任务数量
  const canStartCount = Math.max(0, maxConcurrent - uploadingCount);

  // 按创建时间排序，先创建的先上传
  const tasksToStart = waitingTasks
    .filter(task => task && task.createdAt) // 确保任务及其创建时间存在
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, canStartCount);

  for (const task of tasksToStart) {
    // 更新状态为上传中
    updateTask(task.id, { status: 'uploading' });

    // 为每个任务创建 AbortController
    const abortController = new AbortController();
    taskAbortControllers.set(task.id, abortController);

    // 创建任务的更新副本
    const updatedTask = structuredClone(task);
    updatedTask.status = 'uploading';

    // 异步处理上传
    processFileUpload(
      updatedTask,
      updates => {
        updateTask(task.id, updates);
      },
      getTaskById,
      abortController,
      task.parentId // 从任务中获取父文件夹ID
    ).finally(() => {
      // 上传完成后清理 AbortController
      taskAbortControllers.delete(task.id);
    });
  }
};

/**
 * 取消任务的上传请求并清理服务器端资源
 */
export const cancelTaskUpload = async (taskId: string, task?: UploadTask) => {
  // 取消客户端的上传请求
  const abortController = taskAbortControllers.get(taskId);
  if (abortController) {
    abortController.abort();
    taskAbortControllers.delete(taskId);
  }

  // 如果任务存在且未完成，调用后端API清理服务器端资源
  if (task && ['waiting', 'uploading', 'paused'].includes(task.status)) {
    try {
      const { uploadApi } = await import('../lib/api/upload');
      await uploadApi.cancelUpload(task.fileHash);
    } catch {
      // 静默处理服务器端清理失败，不影响前端状态清理
    }
  }
};

/**
 * 暂停任务的上传请求
 */
export const pauseTaskUpload = (taskId: string) => {
  const abortController = taskAbortControllers.get(taskId);
  if (abortController) {
    abortController.abort();
    taskAbortControllers.delete(taskId);
  }
};
