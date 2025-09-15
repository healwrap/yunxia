# 阿里云制品仓库使用指南

## 仓库信息

- **仓库名称**: yunxia
- **仓库地域**: 华东1（杭州）
- **仓库类型**: 私有
- **代码仓库**: https://github.com/healwrap/yunxia

## 镜像地址

- **公网地址**: registry.cn-hangzhou.aliyuncs.com/pepedd/yunxia
- **专有网络**: registry-vpc.cn-hangzhou.aliyuncs.com/pepedd/yunxia

## 本地开发使用指南

### 1. 登录阿里云容器镜像服务

```bash
docker login --username=pepedd registry.cn-hangzhou.aliyuncs.com
```

用于登录的用户名为阿里云账号全名，密码为开通服务时设置的密码。

### 2. 拉取镜像

```bash
# 拉取前端镜像
docker pull registry.cn-hangzhou.aliyuncs.com/pepedd/yunxia:client-latest

# 拉取后端镜像
docker pull registry.cn-hangzhou.aliyuncs.com/pepedd/yunxia:server-latest
```

### 3. 推送镜像（手动构建时）

```bash
# 构建镜像
cd apps/client
docker build -t yunxia-client .

cd ../server
docker build -t yunxia-server .

# 标记镜像
docker tag yunxia-client registry.cn-hangzhou.aliyuncs.com/pepedd/yunxia:client-latest
docker tag yunxia-server registry.cn-hangzhou.aliyuncs.com/pepedd/yunxia:server-latest

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/pepedd/yunxia:client-latest
docker push registry.cn-hangzhou.aliyuncs.com/pepedd/yunxia:server-latest
```

### 4. 使用 VPC 内网地址（阿里云 ECS 实例内）

如果您的应用部署在阿里云 ECS 实例上，建议使用 VPC 内网地址拉取镜像，可以获得更快的速度并节省公网流量：

```bash
# 登录
docker login --username=pepedd registry-vpc.cn-hangzhou.aliyuncs.com

# 拉取镜像
docker pull registry-vpc.cn-hangzhou.aliyuncs.com/pepedd/yunxia:client-latest
docker pull registry-vpc.cn-hangzhou.aliyuncs.com/pepedd/yunxia:server-latest
```

## CI/CD 配置

### GitHub Secrets 配置

在 GitHub 仓库的 Settings -> Secrets 中添加以下密钥：

- `ALIYUN_USERNAME`: 阿里云账号用户名
- `ALIYUN_PASSWORD`: 阿里云账号密码或访问令牌
- `DEPLOY_HOST`: 部署服务器 IP 地址
- `DEPLOY_USER`: 部署服务器 SSH 用户名
- `DEPLOY_SSH_KEY`: 部署服务器 SSH 私钥
- `CLERK_SECRET_KEY`: Clerk 服务密钥
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk 公钥
- `DB_DATABASE`: 数据库名称
- `DB_USERNAME`: 数据库用户名
- `DB_PASSWORD`: 数据库密码

### 自动部署流程

1. 推送代码到 master 分支会自动触发构建
2. GitHub Actions 将构建 Docker 镜像并推送到阿里云制品仓库
3. 然后通过 SSH 连接到部署服务器，拉取最新镜像并重启服务

## 手动部署

如需手动部署，按照以下步骤操作：

1. 确保服务器上安装了 Docker 和 Docker Compose
2. 登录阿里云容器镜像服务：
   ```bash
   docker login --username=pepedd registry.cn-hangzhou.aliyuncs.com
   ```
3. 创建 `.env` 文件并设置必要的环境变量
4. 使用 docker-compose 启动服务：
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## 注意事项

- 为安全起见，请定期更新阿里云镜像仓库的访问凭证
- 建议在生产环境中使用镜像标签进行版本控制，而不仅仅使用 latest 标签
- 在 ECS 实例上使用 VPC 内网地址可以获得更好的性能并节省公网流量
