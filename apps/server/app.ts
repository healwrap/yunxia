// 加载环境变量，确保这是第一个导入
import cors from '@koa/cors';
// import multer from '@koa/multer';
import Router from '@koa/router';
import dotenv from 'dotenv';
// import fs from 'fs';
import Koa from 'koa';
import path from 'path';

// 导入 Clerk 中间件
import { clerkMiddleware, requireAuth } from './middlewares/clerk';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// 验证 Clerk 密钥是否存在
const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  // eslint-disable-next-line no-console
  console.warn('CLERK_SECRET_KEY is not set! Authentication will not work properly.');
}

const app = new Koa();
const router = new Router();

// // 创建上传目录
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // 配置文件上传
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage: storage });

// // 文件上传路由
// router.post('/upload', upload.single('file'), async ctx => {
//   const file = ctx.request.file;
//   ctx.body = {
//     success: true,
//     message: '文件上传成功',
//     data: {
//       filename: file.filename,
//       originalname: file.originalname,
//       mimetype: file.mimetype,
//       size: file.size,
//     },
//   };
// });

// 测试接口
router.get('/', async ctx => {
  ctx.body = 'Hello World';
});

// 测试 Clerk 验证的受保护路由
router.get('/protected', requireAuth(), async ctx => {
  const { auth } = ctx.state;
  ctx.body = {
    message: '这是受保护的路由',
    userId: auth.sub,
  };
});

// 获取当前用户信息
router.get('/me', requireAuth(), async ctx => {
  const { auth } = ctx.state;
  ctx.body = {
    userId: auth.sub,
    sessionId: auth.sid,
    session: auth,
  };
});
// 配置 CORS

// 简单的CORS配置，允许所有域名跨域
app.use(
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

// 添加 Clerk 中间件到应用
app.use(clerkMiddleware());

// 注册路由
app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // 服务启动成功
  const message = `server is running at http://localhost:${port}`;
  // eslint-disable-next-line no-console
  console.log(message);
});
