import { useAuth } from '@clerk/clerk-react';

import { setRequestToken } from './request';

/**
 * 使用该钩子向请求中添加认证令牌
 * 在需要发送请求前调用此函数获取最新的token
 */
export const useAuthToken = () => {
  const { getToken } = useAuth();

  /**
   * 更新请求中的认证令牌
   * @returns 当前的认证令牌
   */
  const updateRequestToken = async () => {
    try {
      const token = await getToken();
      console.log('获取到认证令牌:', token ? '成功' : '失败');
      setRequestToken(token);
      return token;
    } catch (error) {
      console.error('获取认证令牌失败:', error);
      setRequestToken(null);
      return null;
    }
  };

  return { updateRequestToken };
};
