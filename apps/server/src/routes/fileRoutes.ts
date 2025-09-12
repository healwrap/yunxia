import Router from '@koa/router';

import { FileController } from '../controllers/FileController';
import { requireAuth } from '../middlewares/clerk';

const router = new Router({ prefix: '/api/files' });
const fileController = new FileController();

// 获取文件列表
router.get('/', requireAuth(), fileController.getFiles.bind(fileController));

// 删除文件/文件夹
router.delete('/', requireAuth(), fileController.deleteFiles.bind(fileController));

// 重命名文件/文件夹
router.put('/:id/rename', requireAuth(), fileController.renameFile.bind(fileController));

// 创建文件夹
router.post('/folders', requireAuth(), fileController.createFolder.bind(fileController));

// 获取文件夹路径
router.get('/:id/path', requireAuth(), fileController.getFolderPath.bind(fileController));

// 下载文件
router.get('/:id/download', requireAuth(), fileController.downloadFile.bind(fileController));

export default router;
