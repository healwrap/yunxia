# 统一使用标准镜像
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制整个项目
COPY . .

# 安装所有依赖
RUN pnpm install

# 构建整个项目
RUN pnpm build

# 生产环境
FROM node:20-alpine AS production
WORKDIR /app

# 创建必要的目录
RUN mkdir -p /app/uploads/temp /app/uploads/users /app/logs

# 从构建阶段复制构建好的文件
COPY --from=builder /app/apps/server/dist .
COPY --from=builder /app/node_modules ./node_modules
# 注意：.env.local 文件会在部署时通过环境变量创建

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "app.js"]
