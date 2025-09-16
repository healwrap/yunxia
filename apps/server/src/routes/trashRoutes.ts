import Router from '@koa/router';

import { TrashController } from '../controllers/TrashController';
import { requireAuth } from '../middlewares/clerk';

const router = new Router({ prefix: '/trash' });
const trashController = new TrashController();

// 获取回收站文件列表
router.get('/', requireAuth(), trashController.getTrashFiles.bind(trashController));

// 恢复文件从回收站
router.post('/restore', requireAuth(), trashController.restoreFiles.bind(trashController));

// 清空回收站或永久删除指定文件
router.delete('/', requireAuth(), trashController.clearTrash.bind(trashController));

export default router;
