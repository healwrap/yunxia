import multer from '@koa/multer';
import Router from '@koa/router';
import path from 'path';

import {
  handleCancelUpload,
  handleChunkUpload,
  handleHandshake,
} from '../controllers/uploadController';
import { requireAuth } from '../middlewares/clerk';
import { ensureDir } from '../utils/file';

const router = new Router({
  prefix: '/api/upload',
});

// 创建临时目录
const TEMP_CHUNKS_DIR = path.resolve(process.cwd(), 'uploads', 'temp', 'chunks');

router.get('/status', requireAuth(), async ctx => {
  ctx.body = { code: 200, message: '服务正常', data: null };
});

// 文件上传握手
router.post('/handshake', requireAuth(), handleHandshake);

// 上传文件分片 - 在这里直接配置multer，避免使用控制器中的配置
router.post('/chunk', requireAuth(), async ctx => {
  // 从查询参数中获取fileHash和chunkHash
  const fileHash = ctx.query.fileHash as string;
  const chunkHash = ctx.query.chunkHash as string;

  // 创建分片目录
  const chunkDir = path.join(TEMP_CHUNKS_DIR, fileHash);
  await ensureDir(chunkDir);

  // 配置multer
  const chunkUpload = multer({
    storage: multer.diskStorage({
      destination: async (req, file, cb) => {
        cb(null, chunkDir);
      },
      filename: (req, file, cb) => {
        cb(null, chunkHash);
      },
    }),
  });

  // 应用multer中间件
  await chunkUpload.single('chunk')(ctx, async () => {
    // 继续处理请求
    await handleChunkUpload(ctx);
  });
});

// 取消上传
router.post('/cancel', requireAuth(), handleCancelUpload);

export default router;
