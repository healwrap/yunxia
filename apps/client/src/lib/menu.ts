import { DashboardOutlined, ShareAltOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { createElement } from 'react';

// 菜单类型
export type MenuItem = Required<MenuProps>['items'][number];

/**
 * 生成菜单项配置
 * @param path 路径
 * @param key 菜单键
 * @returns MenuItem
 */
export function getMenuItem(path: string, key: React.Key): MenuItem {
  const pathSegment = path.split('/').pop() || '';
  let icon;
  let label;

  // 根据路径段设置图标和标签
  switch (pathSegment) {
    case 'dashboard':
      icon = createElement(DashboardOutlined);
      label = '文件列表';
      break;
    case 'share':
      icon = createElement(ShareAltOutlined);
      label = '分享';
      break;
    case 'user':
      icon = createElement(UserOutlined);
      label = '用户管理';
      break;
    default:
      icon = createElement(DashboardOutlined);
      label = pathSegment;
      break;
  }

  return {
    key,
    icon,
    label,
  } as MenuItem;
}

/**
 * 从路由配置中提取与工作台相关的路径，生成菜单项
 * @param routes 路由配置
 * @returns MenuItem[]
 */
// 路由类型定义
interface RouteConfig {
  path?: string;
  element?: React.ReactNode;
  children?: RouteConfig[];
  index?: boolean;
}

export function getMenuItems(routes: RouteConfig[]): MenuItem[] {
  if (!routes || !routes.length) return [];

  // 找到bench相关的路由配置
  const benchRoute = routes.find(route => route.path === '/bench');

  if (!benchRoute || !benchRoute.children) return [];

  // 过滤掉index: true的子路由（重定向路由）
  const benchChildren = benchRoute.children.filter((child: RouteConfig) => !child.index);

  // 将子路由转换为菜单项
  return benchChildren.map((child: RouteConfig, index: number) => {
    const path = child.path || '';
    return getMenuItem(`/bench/${path}`, path || `bench-${index}`);
  });
}

/**
 * 根据当前路径确定激活的菜单项
 * @param pathname 当前路径
 * @returns string[]
 */
export function getSelectedKeys(pathname: string): string[] {
  if (!pathname.startsWith('/bench')) return [];

  const segments = pathname.split('/');
  if (segments.length >= 3) {
    return [segments[2] || ''];
  }

  return [];
}
