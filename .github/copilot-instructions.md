# YunXia 云匣 - AI 编程助手指南

## 项目概览

YunXia 是一个对标百度网盘的全栈云存储项目，使用 Turbo + pnpm workspace 仓库架构：

- **前端**: React + TypeScript + Vite + Ant Design + TailwindCSS + Zustand (位于 `apps/client/`)
- **后端**: Koa + TypeScript + TypeORM + PostgreSQL (位于 `apps/server/`)
- **WebAssembly**: 自定义哈希计算包(仅作演示，实际项目使用hash-worker包) (位于 `packages/hash-wasm/`)
- **认证**: Clerk 用户管理系统
- **文件处理**: 分片上传、多线程哈希计算、并发控制

## 关键架构模式

### 分片文件上传系统

- 使用 `apps/client/src/utils/fileUpload.ts` 处理分片上传逻辑
- WebWorker 多线程计算文件哈希值（MD5），使用 `hash-worker` 包
- 上传状态管理在 `apps/client/src/store/uploadStore.ts` (Zustand)
- 服务端控制器 `apps/server/src/controllers/uploadController.ts` 处理握手、分片上传和合并

### 认证与权限

- 前端使用 `@clerk/clerk-react`，主应用包装在 `ClerkProvider` 中
- 认证令牌管理：`apps/client/src/lib/auth.ts` 的 `useAuthToken` 钩子
- 服务端中间件：`apps/server/src/middlewares/clerk.ts` 验证请求
- 路由保护：`apps/client/src/components/ProtectedRoute.tsx`

### 数据模型（TypeORM）

核心实体位于 `apps/server/src/entities/`：

- `File.ts`: 文件/文件夹信息，支持层级结构（parent_id）
- `Share.ts`: 文件分享功能，带过期时间和访问控制
- `UserStorage.ts`: 用户存储空间统计

### 日期时间处理

- 使用 dayjs 配置文件 `apps/client/src/lib/dayjs.ts`
- 必须加载 weekday、localeData、weekOfYear 插件以支持 Ant Design DatePicker
- 在 `main.tsx` 中早期导入配置

## 开发工作流

### 环境启动

```bash
pnpm dev        # 启动所有服务（前端+后端，通过 Turbo）
cd apps/client && pnpm dev    # 仅前端开发服务器
cd apps/server && pnpm dev    # 仅后端开发服务器
```

### 代码质量

- ESLint 配置：`eslint.config.js` 包含前端/后端不同规则
- 自动排序导入：使用 `eslint-plugin-simple-import-sort`
- Prettier 集成用于代码格式化
- TypeScript 严格模式，使用 `pnpm typecheck` 检查类型

### 修复ESLint类型报错

使用命令

```
npx eslint --fix <指定路径>
```

### MCP工具使用

在使用不熟悉的库或API时，请你按照如下顺序进行查找和学习：

1. 使用context mcp工具查询文档
2. 调用工具查询官方文档页面信息
3. 调用工具查询库Github仓库信息

### 提交规范

- 使用 `pnpm commit` 触发 commitizen 交互式提交
- Scope 包括：client、server、hash-wasm、docs、project、ci 等
- Commitlint 强制约定式提交格式

## 组件约定

### 前端组件结构

- 页面组件：`apps/client/src/pages/` 按功能模块组织
- 布局组件：`apps/client/src/layouts/` (BasicLayout、BenchLayout、UserLayout)
- 通用组件：`apps/client/src/components/` 按功能分组
- API 请求：`apps/client/src/lib/api/` 模块化接口定义

### 状态管理

- 使用 Zustand 进行客户端状态管理
- 上传任务状态：支持暂停、恢复、取消操作
- 认证状态：通过 Clerk 的 useAuth 钩子管理

### 服务端模式

- 控制器：`apps/server/src/controllers/` 处理 HTTP 逻辑
- 服务层：`apps/server/src/services/` 处理业务逻辑
- 中间件：认证、错误处理、用户存储初始化
- 路由：模块化路由定义在 `apps/server/src/routes/`

## 特殊注意事项

### WebAssembly 哈希计算

- 自定义 AssemblyScript 包用于高性能 MD5 计算
- 构建命令：`cd packages/hash-wasm && npm run build`
- 在 Web Worker 中使用，避免阻塞主线程

### 环境变量

- 前端：`VITE_CLERK_PUBLISHABLE_KEY`
- 后端：`CLERK_SECRET_KEY`、数据库连接信息
- 配置文件：`.env.local`（服务端使用）

### 文件存储

- 临时文件：`apps/server/uploads/temp/`
- 用户文件：`apps/server/uploads/users/{userId}/`
- 分片上传过程中的状态文件管理

### 错误处理

- 服务端：Winston 日志记录，按日切分
- 前端：ErrorBoundary 组件捕获 React 错误
- 网络请求：`apps/client/src/lib/request.ts` 统一错误处理

当修改分享、上传功能时，注意文件系统的层级关系和权限验证逻辑。
