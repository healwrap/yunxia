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

# 构建服务器项目
RUN cd apps/server && pnpm build

# 生产环境
FROM node:20-alpine AS production
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 创建必要的目录
RUN mkdir -p /app/uploads/temp /app/uploads/users /app/logs

# 复制项目结构和编译后的文件
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages ./packages

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3005

# 暴露端口
EXPOSE 3005

# 使用编译后的 JavaScript 启动
CMD ["node", "apps/server/dist/app.js"]
