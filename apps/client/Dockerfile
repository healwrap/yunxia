# 修复 lightningcss 兼容性问题
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装 pnpm 和必要的构建工具
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
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# 移除默认的nginx静态资源
RUN rm -rf ./*

# 从构建阶段复制构建好的文件
COPY --from=builder /app/apps/client/dist .

# 复制nginx配置文件（从正确的路径）
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
