import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';

import { setAuthToken } from '../lib/request';

/**
 * TokenInitializer 组件
 * 用于在应用启动时初始化 token，并在 token 更新时保持更新
 * 不渲染任何UI元素，仅负责 token 管理
 */
export const TokenInitializer: React.FC = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    // 定义一个异步函数来获取token
    const updateToken = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
      } catch {
        // 静默处理错误，避免使用console
        setAuthToken(null);
      }
    };

    // 首次加载时获取token
    updateToken();

    // 设置定期刷新token的定时器（可选，根据需要调整间隔时间）
    const tokenRefreshInterval = setInterval(updateToken, 60 * 60 * 1000); // 例如每小时刷新一次

    // 清理函数
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, [getToken]);

  // 不渲染任何内容
  return null;
};

export default TokenInitializer;
