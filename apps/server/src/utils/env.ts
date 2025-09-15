/**
 * 环境变量验证工具
 * 确保所有必要的环境变量都已正确设置
 */

interface EnvConfig {
  // 数据库配置
  DB_HOST: string;
  DB_PORT: string;
  DB_DATABASE: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;

  // 认证配置
  CLERK_SECRET_KEY: string;

  // 应用配置
  NODE_ENV: string;
  PORT: string;
}

/**
 * 验证环境变量
 */
export function validateEnvironmentVariables(): EnvConfig {
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_DATABASE',
    'DB_USERNAME',
    'DB_PASSWORD',
    'CLERK_SECRET_KEY',
    'NODE_ENV',
    'PORT',
  ];

  const missingVars: string[] = [];
  const config: Partial<EnvConfig> = {};

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      (config as any)[varName] = value;
    }
  }

  if (missingVars.length > 0) {
    // eslint-disable-next-line no-console
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      // eslint-disable-next-line no-console
      console.error(`   - ${varName}`);
    });
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('✅ All required environment variables are set');

  return config as EnvConfig;
}

/**
 * 显示当前环境变量配置（隐藏敏感信息）
 */
export function displayEnvironmentInfo(): void {
  const sensitiveVars = ['DB_PASSWORD', 'CLERK_SECRET_KEY'];

  // eslint-disable-next-line no-console
  console.log('🔧 Environment Configuration:');
  // eslint-disable-next-line no-console
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  // eslint-disable-next-line no-console
  console.log(`   PORT: ${process.env.PORT}`);
  // eslint-disable-next-line no-console
  console.log(`   DB_HOST: ${process.env.DB_HOST}`);
  // eslint-disable-next-line no-console
  console.log(`   DB_PORT: ${process.env.DB_PORT}`);
  // eslint-disable-next-line no-console
  console.log(`   DB_DATABASE: ${process.env.DB_DATABASE}`);
  // eslint-disable-next-line no-console
  console.log(`   DB_USERNAME: ${process.env.DB_USERNAME}`);

  for (const varName of sensitiveVars) {
    const value = process.env[varName];
    const masked = value ? '***' + value.slice(-4) : 'NOT_SET';
    // eslint-disable-next-line no-console
    console.log(`   ${varName}: ${masked}`);
  }
}
