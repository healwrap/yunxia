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

# 安装 pnpm
RUN npm install -g pnpm

# 创建必要的目录
RUN mkdir -p /app/uploads/temp /app/uploads/users /app/logs

# 复制完整的项目结构以支持 monorepo
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/packages ./packages

# 安装所有依赖（包括 devDependencies 以支持 nodemon 和 tsx）
RUN pnpm install --frozen-lockfile

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3005

# 暴露端口
EXPOSE 3005

# 使用 nodemon 启动应用（类似开发环境）
CMD ["pnpm", "--filter", "@yunxia/server", "dev"]
