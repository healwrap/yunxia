import Router from '@koa/router';

import { ShareController } from '../controllers/ShareController';
import { requireAuth } from '../middlewares/clerk';

const shareRouter = new Router();

// 创建分享
shareRouter.post('/api/shares', requireAuth(), ShareController.createShare);

// 获取分享列表（必须放在 :shareId 路由之前）
shareRouter.get('/api/shares/list', requireAuth(), ShareController.getShareList);

// 获取分享内容（不需要认证）
shareRouter.get('/api/shares/:shareId', ShareController.getShare);

// 生成临时下载链接（不需要认证）
shareRouter.post('/api/shares/:shareId/download-link', ShareController.generateDownloadLink);

// 下载分享文件（不需要认证）
shareRouter.get('/api/shares/:shareId/download', ShareController.downloadShare);

// 更新分享设置
shareRouter.put('/api/shares/:id', requireAuth(), ShareController.updateShare);

// 取消分享
shareRouter.delete('/api/shares/:id', requireAuth(), ShareController.deleteShare);

export default shareRouter;
