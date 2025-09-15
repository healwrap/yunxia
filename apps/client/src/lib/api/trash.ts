import request from '../request';
import type { Response } from './file';

export interface TrashFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  is_folder: boolean;
  deleted_at: string;
  updated_at: string;
  user_id: string;
  parent_id: string | null;
  path: string;
  md5: string | null;
  status: string;
  created_at: string;
}

export interface TrashFileListResponse {
  files: TrashFileItem[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

export interface RestoreFilesResponse {
  restoredCount: number;
  failedIds: string[];
  restoredItems: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface ClearTrashResponse {
  deletedCount: number;
  deletedItems: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export const trashApi = {
  /**
   * 获取回收站文件列表
   */
  async getTrashFiles(
    params: {
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<Response<TrashFileListResponse>> {
    return request({
      url: '/trash',
      method: 'GET',

      params,
    });
  },

  /**
   * 恢复文件从回收站
   */
  async restoreFiles(data: { ids: string[] }): Promise<Response<RestoreFilesResponse>> {
    return request({
      url: '/trash/restore',
      method: 'POST',

      data,
    });
  },

  /**
   * 清空回收站或永久删除指定文件
   */
  async clearTrash(data?: { ids?: string[] }): Promise<Response<ClearTrashResponse>> {
    return request({
      url: '/trash',
      method: 'DELETE',
      data,
    });
  },
};
