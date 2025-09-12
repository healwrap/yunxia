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
   * 下载文件（支持进度回调）
   */
  downloadFile: async (
    fileId: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<void> => {
    // 重新导入axios来发起原始请求
    const { default: axios } = await import('axios');

    // 获取当前的认证头
    const authHeader = request.defaults.headers.common['Authorization'];

    const response = await axios({
      method: 'GET',
      url: `/api/files/${fileId}/download`,
      responseType: 'blob',
      headers: {
        Authorization: authHeader,
      },
      onDownloadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });

    // 从响应头中获取文件名
    let filename = `download_${Date.now()}`;
    const contentDisposition = response.headers?.['content-disposition'];
    if (contentDisposition) {
      // 优先处理 UTF-8 编码的文件名
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
      const normalMatch = contentDisposition.match(/filename="?([^";]+)"?/);

      if (utf8Match) {
        filename = decodeURIComponent(utf8Match[1]);
      } else if (normalMatch) {
        filename = decodeURIComponent(normalMatch[1]);
      }
    }

    // 创建下载链接
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // 确保链接被点击
    document.body.appendChild(link);
    link.click();

    // 延迟清理，确保下载开始
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  },

  /**
   * 获取存储空间信息
   */
  getStorageInfo: async (): Promise<Response<StorageInfo>> => {
    return request.get('/storage/info');
  },
};
