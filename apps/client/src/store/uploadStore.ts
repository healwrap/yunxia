import type { RcFile } from 'antd/es/upload';
import { create } from 'zustand';

import { cancelTaskUpload, pauseTaskUpload, processUploadQueue } from '../utils/fileUpload';

export interface UploadTask {
  id: string;
  file: RcFile;
  fileHash: string;
  status: 'waiting' | 'uploading' | 'paused' | 'success' | 'error';
  progress: number;
  totalChunks: number;
  uploadedChunks: number;
  remainingChunks: string[];
  chunks: Blob[];
  chunkHashes: string[];
  fileId?: string;
  error?: Error;
  createdAt: number;
  parentId?: string; // 添加父文件夹ID
}

interface UploadStore {
  tasks: UploadTask[];
  maxConcurrentUploads: number;
  isUploading: boolean;
  uploadCompleteCallbacks: (() => void)[]; // 上传完成回调列表

  // 添加上传任务
  addTask: (
    task: Omit<
      UploadTask,
      'id' | 'createdAt' | 'status' | 'progress' | 'uploadedChunks' | 'remainingChunks'
    >
  ) => string;
  // 移除上传任务
  removeTask: (id: string) => void;
  // 更新上传任务
  updateTask: (id: string, updates: Partial<UploadTask>) => void;
  // 处理上传队列
  processQueue: () => void;
  // 暂停上传
  pauseTask: (id: string) => void;
  // 恢复上传
  resumeTask: (id: string) => void;
  // 取消上传
  cancelTask: (id: string) => Promise<void>;
  // 设置最大并发上传数
  setMaxConcurrentUploads: (count: number) => void;
  // 获取正在上传的任务数量
  getUploadingCount: () => number;
  // 清除已完成的任务
  clearCompletedTasks: () => void;
  // 添加上传完成回调
  addUploadCompleteCallback: (callback: () => void) => void;
  // 移除上传完成回调
  removeUploadCompleteCallback: (callback: () => void) => void;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  tasks: [],
  maxConcurrentUploads: 3,
  isUploading: false,
  uploadCompleteCallbacks: [],

  addTask: task => {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    set(state => ({
      tasks: [
        ...state.tasks,
        {
          ...task,
          id,
          createdAt: Date.now(),
          status: 'waiting',
          progress: 0,
          uploadedChunks: 0,
          remainingChunks: task.chunkHashes.slice(),
        },
      ],
    }));
    return id;
  },

  removeTask: id => {
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== id),
    }));
  },

  updateTask: (id, updates) => {
    const oldTask = get().tasks.find(task => task.id === id);
    const wasNotSuccess = oldTask && oldTask.status !== 'success';

    set(state => ({
      tasks: state.tasks.map(task => {
        if (task.id === id) {
          // 如果任务已被暂停，并且更新中包含错误状态，则不更新状态
          if (task.status === 'paused' && updates.status === 'error') {
            // 只更新其他字段，保持暂停状态
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { status, ...otherUpdates } = updates;
            return { ...task, ...otherUpdates };
          }
          return { ...task, ...updates };
        }
        return task;
      }),
    }));

    // 如果任务状态从非成功变为成功，触发上传完成回调
    if (wasNotSuccess && updates.status === 'success') {
      const { uploadCompleteCallbacks } = get();
      uploadCompleteCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          // 静默处理回调错误
          void error;
        }
      });
    }
  },

  processQueue: () => {
    const { tasks, maxConcurrentUploads, updateTask } = get();

    // 添加 getTaskById 函数
    const getTaskById = (id: string) => {
      return get().tasks.find(task => task.id === id);
    };

    // 调用文件上传工具处理队列
    processUploadQueue(tasks, maxConcurrentUploads, updateTask, getTaskById);
  },

  pauseTask: id => {
    // 先设置状态为暂停，确保状态优先设置
    set(state => ({
      tasks: state.tasks.map(task => (task.id === id ? { ...task, status: 'paused' } : task)),
    }));

    // 然后取消正在进行的上传请求
    pauseTaskUpload(id);
  },

  resumeTask: id => {
    set(state => ({
      tasks: state.tasks.map(task => {
        // 允许从暂停或失败状态恢复
        if (task.id === id && (task.status === 'paused' || task.status === 'error')) {
          return {
            ...task,
            status: 'waiting',
            error: undefined, // 清除错误信息
          };
        }
        return task;
      }),
    }));

    // 触发上传队列处理
    get().processQueue();
  },

  cancelTask: async id => {
    const task = get().tasks.find(t => t.id === id);

    // 先取消正在进行的上传请求，如果任务未完成则清理服务器端资源
    await cancelTaskUpload(id, task);

    // 移除任务
    get().removeTask(id);
  },

  setMaxConcurrentUploads: count => {
    set({ maxConcurrentUploads: count });
  },

  getUploadingCount: () => {
    return get().tasks.filter(task => task.status === 'uploading').length;
  },

  clearCompletedTasks: () => {
    set(state => ({
      tasks: state.tasks.filter(task => !['success', 'error'].includes(task.status)),
    }));
  },

  addUploadCompleteCallback: callback => {
    set(state => ({
      uploadCompleteCallbacks: [...state.uploadCompleteCallbacks, callback],
    }));
  },

  removeUploadCompleteCallback: callback => {
    set(state => ({
      uploadCompleteCallbacks: state.uploadCompleteCallbacks.filter(cb => cb !== callback),
    }));
  },
}));
