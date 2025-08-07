// 用于 JavaScript 的标准规则和全局变量支持
const eslint = require('@eslint/js');
const globals = require('globals');
// 检查 react hooks 使用是否符合规范
const reactHooks = require('eslint-plugin-react-hooks');
// 配合 react-fresh 会检查你的代码中是否存在与 React Refresh 不兼容的代码模式
const reactRefresh = require('eslint-plugin-react-refresh');
// eslint-prettier插件
const eslintPrettier = require('eslint-plugin-prettier');
// 调整import顺序
const importSort = require('eslint-plugin-simple-import-sort');

const tseslint = require('typescript-eslint');

// TODO 待考虑
const ignores = [
  'dist',
  'build',
  '**/*.js',
  '**/*.mjs',
  '**/*.d.ts',
  'eslint.config.js',
  'commitlint.config.js',
  'apps/frontend/monitor/src/components/ui/**/*',
  'packages/browser-utils/src/metrics/**/*',
];

// 前端 app 规则
const frontendConfig = {
  // TODO 待考虑
  files: ['apps/client/**/*.{ts,tsx}'],
  ignores: ['apps/client/src/components/ui/**/*'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'no-console': 'error',
  },
};

// 后端 app 规则
const backendConfig = {
  // TODO 待考虑
  files: ['apps/server/**/*.ts'],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },
    parser: tseslint.parser,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'error',
  },
};

module.exports = tseslint.config(
  // 主规则
  {
    ignores,
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      prettier: eslintPrettier,
      'simple-import-sort': importSort,
    },
    rules: {
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'error',
    },
  },
  // 其他规则
  frontendConfig,
  backendConfig
);
