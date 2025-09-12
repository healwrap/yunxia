import request from '../request';

export interface Response<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  extension?: string;
  createdAt: string;
  updatedAt: string;
  isFolder: boolean;
  parentId?: string;
}

export interface HandshakeRequest {
  fileHash: string;
  chunkHashes: string[];
  filename: string;
  fileSize: number;
  fileExtension: string;
  mimeType: string; // MIME类型，从前端文件对象获取
  parentId?: string; // 上传到的父文件夹ID，可选，默认根目录
}

export interface HandshakeResponse {
  hasUploaded: boolean;
  chunks: string[]; // 需要上传的分片哈希值列表
  fileId?: string;
}

export interface UploadChunkResponse {
  remainingChunks: string[];
  completed: boolean;
  fileId?: string;
}

export const uploadApi = {
  /**
   * 上传握手请求，验证文件是否已存在及需要上传的分片
   */
  handshake: async (
    params: HandshakeRequest,
    signal?: AbortSignal
  ): Promise<Response<HandshakeResponse>> => {
    return request.post('/upload/handshake', params, {
      signal,
    });
  },

  /**
   * 上传文件分片
   */
  uploadChunk: async (
    chunk: Blob,
    chunkHash: string,
    fileHash: string,
    chunkIndex: number,
    signal?: AbortSignal
  ): Promise<UploadChunkResponse> => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', String(chunkIndex));

    // 将 fileHash 和 chunkHash 作为 URL 参数传递
    const result = await request.post<UploadChunkResponse>(
      `/upload/chunk?fileHash=${encodeURIComponent(fileHash)}&chunkHash=${encodeURIComponent(chunkHash)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal,
      }
    );

    return result.data;
  },

  /**
   * 取消上传
   */
  cancelUpload: async (fileHash: string): Promise<{ success: boolean }> => {
    return request.post('/upload/cancel', { fileHash });
  },
};
