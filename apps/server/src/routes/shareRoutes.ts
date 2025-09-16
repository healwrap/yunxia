import Router from '@koa/router';

import { ShareController } from '../controllers/ShareController';
import { requireAuth } from '../middlewares/clerk';

const shareRouter = new Router({ prefix: '/shares' });

// 创建分享
shareRouter.post('/', requireAuth(), ShareController.createShare);

// 获取分享列表（必须放在 :shareId 路由之前）
shareRouter.get('/list', requireAuth(), ShareController.getShareList);

// 获取分享内容（不需要认证）
shareRouter.get('/:shareId', ShareController.getShare);

// 生成临时下载链接（不需要认证）
shareRouter.post('/:shareId/download-link', ShareController.generateDownloadLink);

// 下载分享文件（不需要认证）
shareRouter.get('/:shareId/download', ShareController.downloadShare);

// 更新分享设置
shareRouter.put('/:id', requireAuth(), ShareController.updateShare);

// 取消分享
shareRouter.delete('/:id', requireAuth(), ShareController.deleteShare);

export default shareRouter;
