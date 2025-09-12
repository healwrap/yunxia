import { message } from 'antd';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// 创建一个 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// token状态标志
let isTokenReady = false;

// 等待中的请求数组
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: AxiosRequestConfig;
}

const pendingRequests: PendingRequest[] = [];

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
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
 * 检查URL是否为公共路径（不需要鉴权）
 */
const isPublicPath = (url: string | undefined): boolean => {
  if (!url) return false;

  const publicPaths = ['/login', '/register', '/public'];
  return publicPaths.some(path => url.includes(path));
};

/**
 * 处理等待中的请求
 */
const processPendingRequests = (): void => {
  if (pendingRequests.length > 0) {
    // 创建一个副本，以便我们可以清空原始数组
    const requests = [...pendingRequests];
    // 清空原始数组
    pendingRequests.splice(0, pendingRequests.length);

    // 执行所有等待中的请求
    requests.forEach(({ config, resolve, reject }) => {
      axios.request(config).then(resolve).catch(reject);
    });
  }
};

/**
 * 设置token的函数，可以在组件中调用
 */
export const setAuthToken = (token: string | null): void => {
  // 设置默认Authorization头
  instance.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';

  // 标记token已准备好
  isTokenReady = true;

  // 处理等待中的请求
  processPendingRequests();
};

// 添加请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 如果是公共路径，或者token已准备好，直接发送请求
    if (isPublicPath(config.url) || isTokenReady) {
      return config;
    }

    // 否则，将请求加入等待队列
    return new Promise((resolve, reject) => {
      pendingRequests.push({
        config,
        resolve,
        reject,
      });

      // 此类型转换是必要的，因为Axios期望的返回类型
    }) as unknown as Promise<InternalAxiosRequestConfig>;
  },
  error => {
    // 对请求错误做些什么
    message.error('请求配置错误');
    return Promise.reject(error);
  }
);

export default instance;
