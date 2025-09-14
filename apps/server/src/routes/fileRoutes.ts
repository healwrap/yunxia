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

// 生成临时下载链接（需要认证）
router.post(
  '/:id/download-link',
  requireAuth(),
  fileController.generateDownloadLink.bind(fileController)
);

// 下载文件（支持token或常规认证）
router.get('/:id/download', fileController.downloadFile.bind(fileController));

export default router;
