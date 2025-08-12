import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src'],
    format: ['cjs'],
    sourcemap: true,
    bundle: true,
    dts: false,
    clean: true,
    minify: true,
    outDir: 'build/cjs',
    // 强制统一输出文件扩展名为 .js
    outExtension: () => ({ js: '.js' }),
  },
  {
    entry: ['src'],
    format: ['esm'],
    sourcemap: true,
    bundle: true,
    dts: false,
    clean: true,
    minify: true,
    outDir: 'build/esm',
    outExtension: () => ({ js: '.js' }),
  },
]);
