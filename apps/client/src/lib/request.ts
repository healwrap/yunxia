import { message } from 'antd';
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 创建一个 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    // 根据错误状态码处理不同情况
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          // 未授权，显示错误消息
          message.error('未登录或登录已过期，请重新登录');
          break;
        case 403:
          // 禁止访问
          message.error('没有权限访问此资源');
          break;
        case 404:
          // 资源不存在
          message.error('请求的资源不存在');
          break;
        case 500:
          // 服务器错误
          message.error('服务器错误，请稍后重试');
          break;
        default:
          // 其他错误
          message.error(error.message || '请求失败，请重试');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      message.error('网络错误，请检查您的网络连接');
    } else {
      // 请求配置出错
      message.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

/**
 * 设置请求头部的认证令牌
 * @param token 认证令牌
 */
export const setRequestToken = (token: string | null): void => {
  // 设置默认Authorization头
  instance.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';
};

// 添加请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  error => {
    // 对请求错误做些什么
    message.error('请求配置错误');
    return Promise.reject(error);
  }
);

export default instance;
