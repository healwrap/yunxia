import request from '../request';

export interface Response<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface CreateShareParams {
  fileId: string;
  password?: string;
  expiredAt?: string;
}

export interface UpdateShareParams {
  password?: string;
  expiredAt?: string;
}

export interface ShareInfo {
  id: string;
  shareId: string;
  password?: string;
  expiredAt?: string;
  createdAt: string;
}

export interface ShareDetail {
  share: {
    id: string;
    expiredAt?: string;
    hasPassword: boolean;
    createdAt: string;
  };
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    isFolder: boolean;
  };
}

export interface ShareListItem {
  id: string;
  fileId: string;
  fileName: string;
  shareId: string;
  hasPassword: boolean;
  expiredAt?: string;
  status: 'active' | 'expired';
  accessCount: number;
  createdAt: string;
}

export interface ShareListResponse {
  shares: ShareListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 创建分享
export const createShare = (params: CreateShareParams): Promise<Response<ShareInfo>> => {
  return request.post('/shares', params);
};

// 获取分享内容
export const getShare = (shareId: string, password?: string): Promise<Response<ShareDetail>> => {
  const params = password ? { password } : {};
  return request.get(`/shares/${shareId}`, { params });
};

// 下载分享文件
export const downloadShare = (shareId: string, password?: string): Promise<Blob> => {
  const params = password ? { password } : {};
  return request.get(`/shares/${shareId}/download`, {
    params,
    responseType: 'blob',
  });
};

// 更新分享设置
export const updateShare = (
  id: string,
  params: UpdateShareParams
): Promise<Response<ShareInfo>> => {
  return request.put(`/shares/${id}`, params);
};

// 取消分享
export const deleteShare = (id: string): Promise<{ code: number; message: string }> => {
  return request.delete(`/shares/${id}`);
};

// 获取分享列表
export const getShareList = (params?: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'expired' | 'all';
}): Promise<Response<ShareListResponse>> => {
  return request.get('/shares/list', { params });
};

// 生成分享链接
export const generateShareUrl = (shareId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/share/${shareId}`;
};
