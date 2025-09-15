import { App } from 'antd';

import { setStaticMethods } from './staticMethodsStore';

/**
 * 静态方法实例初始化组件
 * 必须在 App 组件内部调用，用于初始化全局静态方法实例
 */
export const StaticMethodsInitializer = () => {
  const staticFunction = App.useApp();

  // 设置全局静态方法实例
  setStaticMethods({
    message: staticFunction.message,
    modal: staticFunction.modal,
    notification: staticFunction.notification,
  });

  return null;
};
