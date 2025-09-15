import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';

// 全局静态方法实例
let message: MessageInstance;
let notification: NotificationInstance;
let modal: Omit<ModalStaticFunctions, 'warn'>;

/**
 * 设置全局静态方法实例
 */
export const setStaticMethods = (instances: {
  message: MessageInstance;
  notification: NotificationInstance;
  modal: Omit<ModalStaticFunctions, 'warn'>;
}) => {
  message = instances.message;
  notification = instances.notification;
  modal = instances.modal;
};

// 导出全局静态方法实例，供整个应用使用
export { message, modal, notification };
