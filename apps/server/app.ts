// 加载环境变量，确保这是第一个导入
import cors from '@koa/cors';
import dotenv from 'dotenv';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import path from 'path';

// 导入数据库配置
import { initializeDatabase } from './src/config/database';
import { clerkMiddleware } from './src/middlewares/clerk';
import { errorHandler } from './src/middlewares/error/errorHandler';
import { httpLogger } from './src/middlewares/error/httpLogger';
import { userStorageInitMiddleware } from './src/middlewares/userStorageInit';
// 导入路由
import fileRoutes from './src/routes/fileRoutes';
import shareRoutes from './src/routes/shareRoutes';
import storageRoutes from './src/routes/storageRoutes';
import trashRoutes from './src/routes/trashRoutes';
import uploadRoutes from './src/routes/uploadRoutes';
import { initializeStorage } from './src/utils/file';
import logger from './src/utils/logger';
import { initializeLogDirectory } from './src/utils/logger/initialize';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// 验证 Clerk 密钥是否存在
const secretKey = process.env.CLERK_SECRET_KEY;
if (!secretKey) {
  // eslint-disable-next-line no-console
  console.warn('CLERK_SECRET_KEY is not set! Authentication will not work properly.');
}

const app = new Koa();

// 初始化日志目录
initializeLogDirectory().catch(error => {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize log directory:', error);
  process.exit(1);
});

// 初始化数据库
initializeDatabase().catch(error => {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
});

// 初始化存储目录
initializeStorage().catch(error => {
  logger.error('Failed to initialize storage directories:', error);
  process.exit(1);
});

// 添加错误处理中间件（必须放在最前面）
app.use(errorHandler());

// 添加HTTP请求日志中间件
app.use(httpLogger());

// 配置 CORS
app.use(
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

// 配置请求体解析器
app.use(bodyParser());

// 全局认证中间件
app.use(clerkMiddleware());

// 用户存储初始化中间件
app.use(userStorageInitMiddleware);

// 注册路由
app.use(uploadRoutes.routes());
app.use(uploadRoutes.allowedMethods());

app.use(fileRoutes.routes());
app.use(fileRoutes.allowedMethods());

app.use(shareRoutes.routes());
app.use(shareRoutes.allowedMethods());

app.use(trashRoutes.routes());
app.use(trashRoutes.allowedMethods());

app.use(storageRoutes.routes());
app.use(storageRoutes.allowedMethods());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // 服务启动成功
  const message = `server is running at http://localhost:${port}`;
  logger.info(message);
});
