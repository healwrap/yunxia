/**
 * 文件上传相关类型定义
 */

// 握手请求参数
export interface HandshakeRequest {
  fileHash: string; // 文件MD5哈希值
  chunkHashes: string[]; // 分片哈希数组
  filename: string; // 文件名
  fileSize: number; // 文件大小(字节)
  fileExtension: string; // 文件扩展名
  mimeType: string; // MIME类型，从前端传递
  parentId?: string; // 上传到的父文件夹ID，可选，默认根目录
}

// 握手响应数据
export interface HandshakeResponse {
  hasUploaded: boolean; // 文件是否已完整上传
  chunks: string[]; // 需要上传的分片哈希数组，空数组表示无需上传
  fileId?: string; // 如果已秒传，返回已存在的文件ID
}

// 分片上传请求参数
export interface ChunkUploadRequest {
  fileHash: string; // 文件哈希
  chunkHash: string; // 分片哈希
  chunkIndex: number; // 分片索引
  file: any; // 分片二进制数据
}

// 分片上传响应数据
export interface ChunkUploadResponse {
  uploadSuccess: boolean; // 本次分片上传是否成功
  remainingChunks: string[]; // 剩余未上传分片哈希数组
  completed: boolean; // 整个文件是否上传完成
  fileId?: string; // 文件完成后返回文件ID
  progress: {
    uploaded: number;
    total: number;
    percentage: number;
  };
}

// 分片上传状态文件结构
export interface UploadStatusFile {
  filename: string; // 文件名
  fileHash: string; // 文件哈希值
  fileSize: number; // 文件大小
  fileExtension: string; // 文件扩展名
  mimeType: string; // MIME类型
  uploadedChunks: string[]; // 已上传的分片哈希
  allChunks: string[]; // 所有分片哈希
  userId: string; // 用户ID
  parentId?: string; // 父文件夹ID
  createdAt: string; // 创建时间
  updatedAt?: string; // 更新时间
}
