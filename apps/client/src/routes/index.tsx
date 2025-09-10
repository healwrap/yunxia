import { createElement, lazy } from 'react';
import {
  createBrowserRouter,
  Navigate,
  // Navigate
} from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';

// eslint-disable-next-line react-refresh/only-export-components
export default createBrowserRouter([
  {
    path: '/',
    element: createElement(lazy(() => import('@/layouts/BasicLayout.tsx'))),
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
    ],
  },
  {
    path: '/bench',
    element: (
      <ProtectedRoute>
        {createElement(lazy(() => import('@/layouts/BenchLayout.tsx')))}
      </ProtectedRoute>
    ),
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
]);
