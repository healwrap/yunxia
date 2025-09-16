# 云盘系统架构设计

## 1. 系统整体架构

### 1.2 技术栈选择

### 环境

node18、pnpm包管理工具

### 前端技术栈

- **框架**: React 19
- **构建工具**: Vite 7
- **语言**: TypeScript
- **UI库**: Ant Design 5
- **路由**: React Router 7
- **HTTP客户端**: Axios
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **文件哈希计算**: hash-worker

**可按情况拓展技术栈**

### 后端技术栈

- **框架**: Koa 3
- **语言**: TypeScript
- **数据库**：postgres
- **orm**：typeorm
- **文件上传**: @koa/multer, multer
- **路由**: @koa/router
- **认证**: Clerk (@clerk/clerk-sdk-node)
- **环境变量**: dotenv

**可按情况拓展技术栈**

## 2. 核心功能模块

### 2.1 文件管理功能

#### 2.1.1 文件基础操作

- **文件上传**：支持单文件和多文件上传，大文件分片上传
- **文件下载**：支持单文件和多文件/文件夹打包下载
- **文件预览**：支持常见文件类型的在线预览
- **文件删除**：支持单文件和批量删除，回收站机制
- **文件重命名**：修改文件名称
- **文件移动**：更改文件所在目录
- **文件复制**：复制文件到其他目录

#### 2.1.2 文件夹操作

- **创建文件夹**：在指定路径创建新文件夹
- **删除文件夹**：删除文件夹及其内容
- **重命名文件夹**：修改文件夹名称
- **移动文件夹**：更改文件夹位置

#### 2.1.3 文件搜索与排序

- **搜索功能**：按文件名、类型、大小、创建时间等条件搜索
- **排序功能**：按名称、大小、类型、时间等条件排序
- **筛选功能**：按文件类型、时间范围等筛选

### 2.2 文件分享功能

#### 2.2.1 分享方式

- **链接分享**：生成分享链接
- **密码保护**：设置分享密码
- **有效期设置**：设置分享链接的有效期
- **权限控制**：设置分享内容的访问权限（只读/可编辑）

#### 2.2.2 分享管理

- **分享记录**：查看历史分享记录
- **取消分享**：取消已分享的内容
- **修改分享设置**：修改已分享内容的设置

### 2.3 高级功能

#### 2.3.1 文件传输优化

- **秒传功能**：基于文件MD5哈希值的秒传机制，相同文件无需重复上传
- **断点续传**：支持上传中断后从断点继续上传，通过分片状态文件实现
- **分片上传**：大文件自动分片并发上传，提高传输效率和稳定性
- **分片去重**：相同分片在服务器端只存储一份，节省存储空间
- **上传状态管理**：通过JSON文件记录上传进度，支持多客户端同步状态

#### 2.3.2 文件上传工作流程

**完整上传流程**：

1. **前端准备阶段**
   - 计算文件MD5哈希值
   - 将文件按固定大小分片(如5MB/片)
   - 计算每个分片的哈希值

2. **握手阶段**
   - 发送握手请求，包含文件哈希、分片哈希数组等信息
   - 服务端检查文件是否已存在（秒传检测）
   - 服务端检查已上传的分片，返回需要上传的分片列表

3. **分片上传阶段**
   - 并发上传需要上传的分片
   - 每个分片上传成功后更新服务端状态文件
   - 实时返回剩余分片信息给前端

4. **完成阶段**
   - 所有分片上传完成后，服务端合并分片
   - 创建数据库文件记录
   - 清理临时分片文件和状态文件
   - 移动完整文件到正式存储位置

**异常处理**：

- 网络中断：前端可重新握手获取剩余分片继续上传
- 服务器重启：通过状态文件恢复上传进度
- 分片校验失败：重新上传失败分片
- 超时清理：定期清理长时间未完成的临时文件

#### 2.3.3 存储空间管理

- **存储容量显示**：显示已用空间和总空间
- **存储空间分析**：分析各类型文件占用空间
- **回收站管理**：自动清理过期文件
- **重复文件检测**：基于哈希值检测和管理重复文件

## 3. 数据模型设计

### 3.1 数据库表结构

数据库使用的是postgres数据库

你可以使用dbhub mcp操作数据库的表

#### 3.1.1 files 表

| 字段名     | 类型                     | 描述            |
| ---------- | ------------------------ | --------------- |
| id         | uuid                     | 主键            |
| parent_id  | uuid                     | 父文件夹ID      |
| name       | varchar(255)             | 文件/文件夹名称 |
| path       | text                     | 文件路径        |
| size       | bigint                   | 文件大小(字节)  |
| type       | varchar(255)             | 文件类型        |
| is_folder  | boolean                  | 是否为文件夹    |
| user_id    | varchar(255)             | 所属用户ID      |
| status     | varchar(20)              | 文件状态        |
| md5        | varchar(64)              | 文件MD5哈希值   |
| created_at | timestamp with time zone | 创建时间        |
| updated_at | timestamp with time zone | 更新时间        |

#### 3.1.2 user_storage 表

| 字段名      | 类型                     | 描述           |
| ----------- | ------------------------ | -------------- |
| id          | uuid                     | 主键           |
| user_id     | varchar(255)             | 用户ID         |
| total_space | bigint                   | 总空间(字节)   |
| used_space  | bigint                   | 已用空间(字节) |
| created_at  | timestamp with time zone | 创建时间       |
| updated_at  | timestamp with time zone | 更新时间       |

#### 3.1.3 shares 表

| 字段名       | 类型                     | 描述                |
| ------------ | ------------------------ | ------------------- |
| id           | uuid                     | 主键                |
| file_id      | uuid                     | 分享的文件/文件夹ID |
| share_id     | uuid                     | 随机生成的分享ID    |
| password     | varchar(255)             | 分享密码            |
| expired_at   | timestamp with time zone | 过期时间            |
| access_count | integer                  | 访问次数            |
| created_at   | timestamp with time zone | 创建时间            |

### 3.2 文件存储结构

文件将按照以下结构进行物理存储：

```
/storage
  /users
    /{user_id}
      /{file_id}__{filename}
  /temp
    /chunks
      /{file_hash}
        /{chunk_hash}
      /{file_hash}.json    # 分片上传状态文件
```

#### 3.2.1 分片上传状态文件结构

`{file_hash}.json` 文件格式：

```json
{
  "filename": "example.pdf",
  "fileHash": "abc123...",
  "fileSize": 1048576,
  "fileExtension": ".pdf",
  "uploadedChunks": ["chunk_hash_1", "chunk_hash_2"],
  "allChunks": ["chunk_hash_1", "chunk_hash_2", "chunk_hash_3"],
  "userId": "user_123",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

## 4. 接口设计

### 4.1 文件管理接口

#### 4.1.1 文件上传

分片上传系统，实现秒传和断点续传功能

##### 握手接口 (handshake)

**接口路径**: `POST /upload/handshake`

**请求参数**:

```json
{
  "fileHash": "abc123...", // 文件MD5哈希值
  "chunkHashes": ["hash1", "hash2"], // 分片哈希数组
  "filename": "example.pdf", // 文件名
  "fileSize": 1048576, // 文件大小(字节)
  "fileExtension": ".pdf", // 文件扩展名
  "parentId": "parent_folder_uuid" // 上传到的父文件夹ID，可选，默认根目录
}
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "hasUploaded": false, // 文件是否已完整上传
    "chunks": ["hash2"], // 需要上传的分片哈希数组，空数组表示无需上传
    "fileId": "uuid" // 如果已秒传，返回已存在的文件ID
  }
}
```

**交互逻辑**:

1. 检查文件哈希是否在数据库中存在
   - 如果存在：创建新的文件记录(关联到当前用户)，返回 `hasUploaded: true`
2. 如果不存在：检查是否有部分分片已上传
   - 创建或读取 `{file_hash}.json` 状态文件
   - 返回未上传的分片哈希数组

##### 分片上传接口 (uploadChunk)

**接口路径**: `POST /upload/chunk`

**请求参数**:

查询参数:

```
fileHash: string         // 文件哈希
chunkHash: string        // 分片哈希
```

表单数据 (multipart/form-data):

```
chunkIndex: number       // 分片索引
file: binary            // 分片二进制数据
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "uploadSuccess": true, // 本次分片上传是否成功
    "remainingChunks": ["hash3"], // 剩余未上传分片哈希数组
    "completed": false, // 整个文件是否上传完成
    "fileId": "uuid", // 文件完成后返回文件ID
    "progress": {
      "uploaded": 2,
      "total": 3,
      "percentage": 66.67
    }
  }
}
```

**交互逻辑**:

1. 验证分片哈希值是否正确
2. 检查分片是否已存在
   - 如果已存在：更新状态文件，返回剩余分片信息
3. 保存分片到临时目录
4. 更新 `{file_hash}.json` 状态文件
5. 检查是否所有分片都已上传
   - 如果完成：合并分片，移动到正式存储位置，创建数据库记录
   - 如果未完成：返回剩余分片信息

#### 4.1.2 创建文件夹

**接口路径**: `POST /folders`

**请求参数**:

```json
{
  "name": "新文件夹",
  "parentId": "parent_folder_uuid" // 可选，默认为根目录
}
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "folder_uuid",
    "name": "新文件夹",
    "parentId": "parent_folder_uuid",
    "path": "/path/to/folder",
    "isFolder": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

#### 4.1.3 获取文件列表

**接口路径**: `GET /files`

**查询参数**:

```
parentId: string      // 父文件夹ID，可选，默认根目录
page: number         // 页码，默认1
pageSize: number     // 每页数量，默认20
sortBy: string       // 排序字段：name|size|type|created_at
sortOrder: string    // 排序方向：asc|desc
searchKeyword: string // 搜索关键词，可选
fileType: string     // 文件类型筛选，可选
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "files": [
      {
        "id": "file_uuid",
        "parentId": "parent_folder_uuid",
        "name": "文件名",
        "size": 1048576,
        "type": "application/pdf",
        "isFolder": false,
        "path": "/path/to/file",
        "md5": "abc123...",
        "status": "normal",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    },
    "currentPath": "/path/to/current/folder"
  }
}
```

#### 4.1.4 删除文件/文件夹

**接口路径**: `DELETE /files`

**请求参数**:

```json
{
  "ids": ["file_uuid1", "file_uuid2"], // 文件/文件夹ID数组
  "permanent": false // 是否永久删除，默认false(放入回收站)
}
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "deletedCount": 2,
    "failedIds": [], // 删除失败的ID列表
    "deletedItems": [
      {
        "id": "file_uuid1",
        "name": "文件名1",
        "type": "file"
      }
    ]
  }
}
```

#### 4.1.5 重命名文件/文件夹

**接口路径**: `PUT /files/{id}/rename`

**请求参数**:

```json
{
  "name": "新文件名"
}
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "file_uuid",
    "name": "新文件名",
    "path": "/new/path/to/file",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

#### 4.1.6 移动文件/文件夹

**接口路径**: `PUT /files/move`

**请求参数**:

```json
{
  "ids": ["file_uuid1", "file_uuid2"], // 要移动的文件ID数组
  "targetParentId": "target_folder_uuid" // 目标文件夹ID，null表示移动到根目录
}
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "movedCount": 2,
    "failedIds": [], // 移动失败的ID列表
    "movedItems": [
      {
        "id": "file_uuid1",
        "name": "文件名1",
        "newPath": "/new/path/to/file1"
      }
    ]
  }
}
```

#### 4.1.7 复制文件/文件夹

**接口路径**: `POST /files/copy`

**请求参数**:

```json
{
  "ids": ["file_uuid1", "file_uuid2"], // 要复制的文件ID数组
  "targetParentId": "target_folder_uuid" // 目标文件夹ID
}
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "copiedCount": 2,
    "failedIds": [],
    "copiedItems": [
      {
        "originalId": "file_uuid1",
        "newId": "new_file_uuid1",
        "name": "文件名1 - 副本"
      }
    ]
  }
}
```

#### 4.1.8 文件下载

**接口路径**: `GET /files/{id}/download`

**查询参数**:

```
preview: boolean     // 是否为预览模式，可选
inline: boolean      // 是否内联显示，可选
```

**返回**: 文件流，设置适当的Content-Type和Content-Disposition头

#### 4.1.9 批量下载

**接口路径**: `POST /files/batch-download`

**请求参数**:

```json
{
  "ids": ["file_uuid1", "folder_uuid2"] // 文件/文件夹ID数组
}
```

**返回**: ZIP压缩包文件流，文件名格式为`files_${timestamp}.zip`

#### 4.1.10 获取存储空间信息

**接口路径**: `GET /storage/info`

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalSpace": 10737418240, // 总空间(字节)
    "usedSpace": 1073741824, // 已用空间(字节)
    "availableSpace": 9663676416, // 可用空间(字节)
    "usagePercentage": 10.0, // 使用百分比
    "fileTypeStats": [
      {
        "type": "image",
        "count": 150,
        "size": 524288000
      },
      {
        "type": "document",
        "count": 80,
        "size": 314572800
      }
    ]
  }
}
```

### 4.2 文件分享接口

#### 4.2.1 创建分享

**接口路径**: `POST /shares`

**请求参数**:

```json
{
  "fileId": "file_uuid",
  "password": "123456", // 可选，分享密码
  "expiredAt": "2025-12-31T23:59:59Z" // 可选，过期时间
}
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "share_uuid",
    "shareId": "abc123def456", // 分享令牌
    "password": "123456",
    "expiredAt": "2025-12-31T23:59:59Z",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### 4.2.2 获取分享内容

**接口路径**: `GET /shares/{shareId}`

**查询参数**:

```
password: string     // 如果有密码保护，通过查询参数传递
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "share": {
      "id": "share_uuid",
      "expiredAt": "2025-12-31T23:59:59Z",
      "hasPassword": true,
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "file": {
      "id": "file_uuid",
      "name": "分享的文件",
      "size": 1048576,
      "type": "application/pdf",
      "isFolder": false
    }
  }
}
```

#### 4.2.3 下载分享文件

**接口路径**: `GET /shares/{shareId}/download`

**查询参数**:

```
password: string     // 如果有密码保护，通过查询参数传递
```

**返回**: 文件流

#### 4.2.4 更新分享设置

**接口路径**: `PUT /shares/{id}`

**请求参数**:

```json
{
  "password": "new123456", // 可选，更新密码
  "expiredAt": "2025-12-31T23:59:59Z" // 可选，更新过期时间
}
```

#### 4.2.5 取消分享

**接口路径**: `DELETE /shares/{id}`

**返回数据**:

```json
{
  "code": 200,
  "message": "success"
}
```

#### 4.2.6 获取分享列表

**接口路径**: `GET /shares/list`

**查询参数**:

```
page: number         // 页码，默认1
pageSize: number     // 每页数量，默认20
status: string       // 分享状态筛选：active|expired|all，默认active
```

**返回数据**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "shares": [
      {
        "id": "share_uuid",
        "fileId": "file_uuid",
        "fileName": "分享的文件",
        "shareId": "abc123def456",
        "hasPassword": true,
        "expiredAt": "2025-12-31T23:59:59Z",
        "status": "active", // active|expired
        "accessCount": 10, // 访问次数
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 4.3 回收站接口

#### 4.3.1 获取回收站列表

**接口路径**: `GET /trash`

**查询参数**:

```
page: number         // 页码，默认1
pageSize: number     // 每页数量，默认20
sortBy: string       // 排序字段：name|size|deleted_at
sortOrder: string    // 排序方向：asc|desc
```

#### 4.3.2 恢复文件

**接口路径**: `POST /trash/restore`

**请求参数**:

```json
{
  "ids": ["file_uuid1", "file_uuid2"]
}
```

#### 4.3.3 永久删除

**接口路径**: `DELETE /trash`

**请求参数**:

```json
{
  "ids": ["file_uuid1", "file_uuid2"] // 可选，不传则清空回收站
}
```

## 5. 前端设计

### 6.1 页面结构

- **登录/注册页**：用户认证
- **主页/文件列表**：显示文件和文件夹
- **上传页面**：文件上传界面和进度
- **分享管理**：管理分享内容
- **分享访问页**：外部访问分享内容的页面
- **设置页面**：用户设置和偏好

### 6.2 组件设计

- **文件列表组件**：显示文件和文件夹，支持排序和筛选
- **文件上传组件**：处理文件上传，显示实时进度和状态
- **文件操作菜单**：提供文件操作选项(重命名、移动、删除等)
- **文件预览组件**：预览不同类型的文件
- **分享设置组件**：配置分享选项(密码、有效期等)
- **存储空间组件**：显示存储使用情况和配额
- **上传队列组件**：管理多文件上传队列和进度
