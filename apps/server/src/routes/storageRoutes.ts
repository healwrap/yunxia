import Router from '@koa/router';

import { StorageController } from '../controllers/StorageController';
import { requireAuth } from '../middlewares/clerk';

const router = new Router({ prefix: '/api/storage' });
const storageController = new StorageController();

// 获取用户存储信息
router.get('/info', requireAuth(), storageController.getStorageInfo.bind(storageController));

// 初始化用户存储
router.post(
  '/initialize',
  requireAuth(),
  storageController.initializeStorage.bind(storageController)
);

// 重新计算存储空间
router.post(
  '/recalculate',
  requireAuth(),
  storageController.recalculateStorage.bind(storageController)
);

export default router;
