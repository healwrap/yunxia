import { createElement, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// eslint-disable-next-line react-refresh/only-export-components
export default createBrowserRouter([
  {
    path: '/',
    element: createElement(lazy(() => import('@/layouts/BasicLayout.tsx'))),
    errorElement: createElement(ErrorBoundary),
    children: [
      // 跳转示例
      // {
      //   index: true,
      //   element: <Navigate to="/home" replace />,
      // },
      {
        path: '/',
        element: createElement(lazy(() => import('@/pages/home/index.tsx'))),
      },
      {
        path: 'test',
        element: createElement(lazy(() => import('@/pages/home/api-test.tsx'))),
      },
    ],
  },
  {
    path: '/bench',
    element: (
      <ProtectedRoute>
        {createElement(lazy(() => import('@/layouts/BenchLayout.tsx')))}
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
        element: createElement(lazy(() => import('@/pages/dashboard/index.tsx'))),
      },
      {
        path: 'share',
        element: createElement(lazy(() => import('@/pages/share/index.tsx'))),
      },
    ],
  },
  {
    path: '/user',
    element: createElement(lazy(() => import('@/layouts/UserLayout.tsx'))),
    errorElement: createElement(ErrorBoundary),
    children: [
      {
        path: 'login',
        element: createElement(lazy(() => import('@/pages/user/login/index.tsx'))),
      },
      {
        path: 'login/sso-callback',
        element: createElement(lazy(() => import('@/pages/user/sso-callback.tsx'))),
      },
      {
        path: 'register',
        element: createElement(lazy(() => import('@/pages/user/register/index.tsx'))),
      },
    ],
  },
  // 添加通配符路由，捕获所有未匹配的路径
  {
    path: '*',
    element: createElement(ErrorBoundary),
  },
]);
