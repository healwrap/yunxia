import { useAuth } from '@clerk/clerk-react';
import { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  // 如果认证状态还在加载中，可以显示加载状态
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // 如果用户未登录，重定向到登录页面，并携带当前路径作为重定向参数
  if (!isSignedIn) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/user/login?redirect=${redirectPath}`} replace />;
  }

  // 如果用户已登录，显示受保护的路由内容
  return <>{children}</>;
}
