import { ComponentType, useEffect } from 'react';

import { useAuthToken } from './auth';

/**
 * 高阶组件，确保组件在渲染前更新认证令牌
 */
export const withAuth = <P extends object>(Component: ComponentType<P>) => {
  return (props: P) => {
    const { updateRequestToken } = useAuthToken();

    useEffect(() => {
      // 组件挂载时更新令牌
      updateRequestToken();
    }, [updateRequestToken]);

    return <Component {...props} />;
  };
};
