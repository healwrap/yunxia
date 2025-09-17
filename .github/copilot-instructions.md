# YunXia 云匣 - AI 编程助手指南

## 项目概览

YunXia 是一个对标百度网盘的全栈云存储项目，使用 Turbo + pnpm workspace 仓库架构：

- **前端**: React 19 + TypeScript + Vite + Ant Design + TailwindCSS 4 + Zustand (`apps/client/`)
- **后端**: Koa + TypeScript + TypeORM + PostgreSQL (`apps/server/`)
- **WebAssembly**: 自定义哈希计算包(仅作演示，实际项目使用hash-worker包) (位于 `packages/hash-wasm/`)
- **认证**: Clerk 用户管理系统
- **核心特性**: 分片上传、WebWorker 哈希计算、并发控制、存储空间管理

## 核心架构模式

### 三阶段文件上传协议

这是项目的核心业务流程，必须理解其完整工作机制：

**握手阶段** (`POST /upload/handshake`)：

- 前端使用 `hash-worker` 计算文件 MD5 和 10MB 分片哈希
- 检查文件是否已存在（秒传），存储空间是否足够
- 返回需要上传的分片列表，支持断点续传

**分片上传** (`POST /upload/chunk`)：

- 通过 URL 参数传递 `fileHash` 和 `chunkHash`
- 使用 `@koa/multer` 处理分片文件存储到 `uploads/temp/chunks/{fileHash}/`
- 维护状态文件 `{fileHash}.json` 跟踪上传进度

**合并完成**：

- 所有分片上传完成后自动触发合并
- 创建数据库记录，移动文件到 `uploads/users/{userId}/`
- 更新用户存储空间统计

关键实现文件：

- `apps/client/src/utils/fileUpload.ts` - 上传流程控制
- `apps/client/src/store/uploadStore.ts` - Zustand 状态管理
- `apps/server/src/controllers/uploadController.ts` - 三阶段协议实现

### 存储空间管理

**逻辑空间概念**：用户空间 = ACTIVE 文件 + TRASH 文件（不区分状态，只看数据库记录）

- `UserStorageService.recalculateUsedSpace()` 基于数据库重新计算
- 上传前检查空间，不足时返回 413 状态码
- 文件删除到回收站不释放空间，彻底删除才释放
- 默认 10GB 用户空间

### Clerk 认证集成

**前端令牌管理**：

- `useAuthToken().updateRequestToken()` 获取最新令牌
- 所有 API 请求自动添加 `Authorization: Bearer {token}`
- `ProtectedRoute` 组件处理路由保护

**后端验证机制**：

- `clerkMiddleware()` 验证令牌，失败时 `ctx.state.auth = null`
- `requireAuth()` 确保路由需要认证
- 支持临时下载令牌绕过认证（分享功能）

### 数据模型关系

TypeORM 实体设计（`apps/server/src/entities/`）：

```typescript
File {
  id: uuid
  parent_id: uuid | null    // 支持文件夹层级
  user_id: string          // 关联用户
  status: ACTIVE | TRASH   // 文件状态
  md5: string             // 支持秒传
}

Share {
  file_id: uuid           // 关联文件
  share_id: uuid          // 公开分享ID
  password: string?       // 可选访问密码
  expired_at: timestamp?  // 可选过期时间
}

UserStorage {
  user_id: string
  total_space: bigint     // 默认 10GB
  used_space: bigint      // 包含回收站文件
}
```

## 开发实践

### 环境管理

```bash
pnpm dev              # 启动所有服务（推荐）
pnpm typecheck        # 类型检查
pnpm commit           # 规范化提交（commitizen）
```

**环境变量**：

- 前端：`VITE_CLERK_PUBLISHABLE_KEY`
- 后端：`CLERK_SECRET_KEY`、数据库配置
- 开发时使用 `.env.local`

### 状态管理模式

**Zustand 上传状态**：

- 最大 3 个并发上传任务
- 支持暂停/恢复/取消操作
- 任务状态：`waiting | uploading | paused | success | error`

**前端组件模式**：

- 页面组件：`apps/client/src/pages/`
- 布局：`BenchLayout`（主要工作区）、`UserLayout`（登录页）
- API 层：`apps/client/src/lib/api/` 模块化接口

### 服务端架构

**分层设计**：

- 控制器：HTTP 请求处理
- 服务层：业务逻辑（`UserStorageService`、`FileDeleteService`）
- 中间件：认证、日志、错误处理
- 工具函数：文件操作、令牌生成

**文件存储结构**：

```
uploads/
├── temp/chunks/{fileHash}/     # 上传分片
├── users/{userId}/             # 用户文件
└── temp/{fileHash}.json        # 上传状态
```

## 关键开发约定

### 错误处理

- 服务端：Winston 日志，按日切分
- 前端：ErrorBoundary + 统一请求错误处理
- 上传失败：保持状态文件支持断点续传

### 代码规范

- ESLint 自动修复：`npx eslint --fix <path>`
- 导入排序：`eslint-plugin-simple-import-sort`
- 提交格式：Scope 包括 client、server、docs、ci

### 关键注意点

1. **文件路径处理**：支持文件夹层级，删除时需考虑子文件
2. **分享权限**：临时下载令牌机制，支持密码保护
3. **存储计算**：逻辑空间概念，回收站文件仍占用空间
4. **并发控制**：上传队列管理，避免过多并发请求

当修改文件、分享、存储相关功能时，务必理解这些核心概念和数据流。
