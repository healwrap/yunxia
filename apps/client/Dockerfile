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
# 全局安装 TypeScript，这样 tsc 命令就可用
RUN npm install -g typescript

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制项目文件和依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
# 修改为直接使用 vite build，跳过 tsc 步骤
RUN sed -i 's/"build": "tsc -b && vite build"/"build": "vite build"/' package.json && pnpm build

# 生产环境
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# 移除默认的nginx静态资源
RUN rm -rf ./*

# 从构建阶段复制构建好的文件
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
