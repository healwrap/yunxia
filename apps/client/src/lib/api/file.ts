import request from '../request';

export interface Response<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface FileItem {
  id: string;
  parentId?: string;
  name: string;
  size: number;
  type: string;
  isFolder: boolean;
  path: string;
  md5?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileListResponse {
  files: FileItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  currentPath: string;
}

export interface StorageInfo {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  usagePercentage: number;
  fileTypeStats: Array<{
    type: string;
    count: number;
    size: number;
  }>;
}

export interface DownloadLinkResponse {
  downloadUrl: string;
  token: string;
  expiresIn: number; // 秒
  fileName: string;
  fileSize: number;
}

export interface DeleteFilesRequest {
  ids: string[];
  permanent?: boolean;
}

export interface DeleteFilesResponse {
  deletedCount: number;
  failedIds: string[];
  deletedItems: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface RenameFileRequest {
  name: string;
}

export interface RenameFileResponse {
  id: string;
  name: string;
  path: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

export interface CreateFolderResponse {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  isFolder: boolean;
  createdAt: string;
  updatedAt: string;
}

export const fileApi = {
  /**
   * 获取文件列表
   */
  getFiles: async (params?: {
    parentId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
    searchKeyword?: string;
    fileType?: string;
  }): Promise<Response<FileListResponse>> => {
    return request.get('/files', { params });
  },

  /**
   * 获取文件夹面包屑路径
   */
  getFolderPath: async (
    folderId: string
  ): Promise<Response<{ path: Array<{ id: string; name: string }> }>> => {
    return request.get(`/files/${folderId}/path`);
  },

  /**
   * 删除文件/文件夹
   */
  deleteFiles: async (data: DeleteFilesRequest): Promise<Response<DeleteFilesResponse>> => {
    return request.delete('/files', { data });
  },

  /**
   * 重命名文件/文件夹
   */
  renameFile: async (
    id: string,
    data: RenameFileRequest
  ): Promise<Response<RenameFileResponse>> => {
    return request.put(`/files/${id}/rename`, data);
  },

  /**
   * 创建文件夹
   */
  createFolder: async (data: CreateFolderRequest): Promise<Response<CreateFolderResponse>> => {
    return request.post('/files/folders', data);
  },

  /**
   * 生成临时下载链接
   */
  generateDownloadLink: async (fileId: string): Promise<Response<DownloadLinkResponse>> => {
    return request.post(`/files/${fileId}/download-link`);
  },

  /**
   * 简化版下载文件（直接打开下载链接）
   */
  downloadFileSimple: async (fileId: string): Promise<string> => {
    const response = await fileApi.generateDownloadLink(fileId);
    return response.data.downloadUrl;
  },

  /**
   * 获取存储空间信息
   */
  getStorageInfo: async (): Promise<Response<StorageInfo>> => {
    return request.get('/storage/info');
  },
};
