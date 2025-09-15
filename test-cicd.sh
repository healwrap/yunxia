#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}    云匣项目 CI/CD 本地测试脚本    ${NC}"
echo -e "${BLUE}=======================================${NC}"

# 检查 Docker 是否安装
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}错误: Docker 未安装.${NC}" >&2
  exit 1
fi

# 检查 Docker Compose 是否安装
if ! [ -x "$(command -v docker-compose)" ]; then
  echo -e "${RED}错误: Docker Compose 未安装.${NC}" >&2
  exit 1
fi

# 创建测试环境变量文件
echo -e "${YELLOW}创建测试环境变量...${NC}"
cat > .env.test << EOL
CLERK_SECRET_KEY=test_key
VITE_CLERK_PUBLISHABLE_KEY=test_key
DB_DATABASE=yunxia_test
DB_USERNAME=yunxia_test
DB_PASSWORD=yunxia_test
EOL

# 构建客户端镜像
echo -e "${YELLOW}构建客户端镜像...${NC}"
docker build -t yunxia-client:test -f ./apps/client/Dockerfile .

if [ $? -ne 0 ]; then
  echo -e "${RED}客户端镜像构建失败${NC}"
  exit 1
fi

echo -e "${GREEN}客户端镜像构建成功${NC}"

# 构建服务端镜像
echo -e "${YELLOW}构建服务端镜像...${NC}"
docker build -t yunxia-server:test -f ./apps/server/Dockerfile .

if [ $? -ne 0 ]; then
  echo -e "${RED}服务端镜像构建失败${NC}"
  exit 1
fi

echo -e "${GREEN}服务端镜像构建成功${NC}"

# 创建 docker-compose 测试文件
echo -e "${YELLOW}创建 docker-compose 测试文件...${NC}"
cat > docker-compose.test.yml << EOL
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: yunxia-postgres-test
    restart: unless-stopped
    environment:
      POSTGRES_DB: \${DB_DATABASE}
      POSTGRES_USER: \${DB_USERNAME}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data_test:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USERNAME} -d \${DB_DATABASE}"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    image: yunxia-server:test
    container_name: yunxia-server-test
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=\${DB_DATABASE}
      - DATABASE_USER=\${DB_USERNAME}
      - DATABASE_PASSWORD=\${DB_PASSWORD}
      - CLERK_SECRET_KEY=\${CLERK_SECRET_KEY}
    volumes:
      - ./test-uploads:/app/uploads
      - ./test-logs:/app/logs
    ports:
      - "3000:3000"

  client:
    image: yunxia-client:test
    container_name: yunxia-client-test
    restart: unless-stopped
    depends_on:
      - server
    environment:
      - VITE_CLERK_PUBLISHABLE_KEY=\${VITE_CLERK_PUBLISHABLE_KEY}
      - VITE_API_URL=/api
    ports:
      - "8080:80"

volumes:
  postgres_data_test:
    driver: local
EOL

# 启动测试环境
echo -e "${YELLOW}启动测试环境...${NC}"
mkdir -p test-uploads test-logs
docker-compose -f docker-compose.test.yml --env-file .env.test up -d

if [ $? -ne 0 ]; then
  echo -e "${RED}测试环境启动失败${NC}"
  exit 1
fi

echo -e "${GREEN}测试环境启动成功!${NC}"
echo -e "${BLUE}--------------------------------------${NC}"
echo -e "${GREEN}客户端地址: http://localhost:8080${NC}"
echo -e "${GREEN}服务端地址: http://localhost:3000${NC}"
echo -e "${BLUE}--------------------------------------${NC}"
echo -e "${YELLOW}你可以使用以下命令查看容器日志:${NC}"
echo -e "  docker-compose -f docker-compose.test.yml logs -f"
echo -e "${YELLOW}使用以下命令停止测试环境:${NC}"
echo -e "  docker-compose -f docker-compose.test.yml down"