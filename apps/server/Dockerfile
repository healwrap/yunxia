FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
FROM base AS deps
WORKDIR /app

COPY package.json ./

# 安装依赖（不使用 lockfile）
RUN pnpm install --no-frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制项目文件和依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN pnpm build

# 生产环境
FROM node:20-alpine AS production
WORKDIR /app

# 创建必要的目录
RUN mkdir -p /app/uploads/temp /app/uploads/users /app/logs

# 从构建阶段复制构建好的文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# 注意：.env.local 文件会在部署时通过环境变量创建

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/app.js"]
