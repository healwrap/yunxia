import { createElement, lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RouteLoading } from '@/components/RouteLoading';

// 辅助函数：为懒加载组件添加 Suspense 和加载动画
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withSuspense = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>) => {
  return <Suspense fallback={<RouteLoading />}>{createElement(LazyComponent)}</Suspense>;
};

// eslint-disable-next-line react-refresh/only-export-components
export default createBrowserRouter([
  {
    path: '/',
    element: withSuspense(lazy(() => import('@/layouts/BasicLayout.tsx'))),
    errorElement: createElement(ErrorBoundary),
    children: [
      // 跳转示例
      // {
      //   index: true,
      //   element: <Navigate to="/home" replace />,
      // },
      {
        path: '/',
        element: withSuspense(lazy(() => import('@/pages/home/index.tsx'))),
      },
      {
        path: 'test',
        element: withSuspense(lazy(() => import('@/pages/home/api-test.tsx'))),
      },
    ],
  },
  {
    path: '/bench',
    element: (
      <ProtectedRoute>
        {withSuspense(lazy(() => import('@/layouts/BenchLayout.tsx')))}
      </ProtectedRoute>
    ),
    errorElement: createElement(ErrorBoundary),
    children: [
      {
        index: true,
        element: <Navigate to="/bench/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(lazy(() => import('@/pages/dashboard/index.tsx'))),
      },
      {
        path: 'dashboard/:folderId',
        element: withSuspense(lazy(() => import('@/pages/dashboard/index.tsx'))),
      },
      {
        path: 'share',
        element: withSuspense(lazy(() => import('@/pages/share/index.tsx'))),
      },
    ],
  },
  {
    path: '/user',
    element: withSuspense(lazy(() => import('@/layouts/UserLayout.tsx'))),
    errorElement: createElement(ErrorBoundary),
    children: [
      {
        path: 'login',
        element: withSuspense(lazy(() => import('@/pages/user/login/index.tsx'))),
      },
      {
        path: 'login/sso-callback',
        element: withSuspense(lazy(() => import('@/pages/user/sso-callback.tsx'))),
      },
      {
        path: 'register',
        element: withSuspense(lazy(() => import('@/pages/user/register/index.tsx'))),
      },
    ],
  },
  // 公共分享访问页面（无需认证）
  {
    path: '/share/:shareId',
    element: withSuspense(lazy(() => import('@/pages/share/access.tsx'))),
    errorElement: createElement(ErrorBoundary),
  },
  // 添加通配符路由，捕获所有未匹配的路径
  {
    path: '*',
    element: createElement(ErrorBoundary),
  },
]);
