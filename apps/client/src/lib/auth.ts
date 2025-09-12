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
    // 此方法不可 useCallback 否则导致状态变化时 token 不更新
    try {
      const token = await getToken();
      setRequestToken(token);
      return token;
    } catch {
      setRequestToken(null);
      return null;
    }
  };

  return { updateRequestToken };
};
