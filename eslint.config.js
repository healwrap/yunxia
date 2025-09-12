// 用于 JavaScript 的标准规则和全局变量支持
import eslint from '@eslint/js';
import globals from 'globals';
// 检查 react hooks 使用是否符合规范
import reactHooks from 'eslint-plugin-react-hooks';
// 配合 react-fresh 会检查你的代码中是否存在与 React Refresh 不兼容的代码模式
import reactRefresh from 'eslint-plugin-react-refresh';
// eslint-prettier插件
import eslintPrettier from 'eslint-plugin-prettier';
// 调整import顺序
import importSort from 'eslint-plugin-simple-import-sort';
// typescript-eslint
import * as tseslint from 'typescript-eslint';

// 忽略的文件和目录
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
  files: ['apps/client/**/*.{ts,tsx}'],
  ignores: ['apps/client/src/components/ui/**/*'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
    parser: tseslint.parser,
  },
  plugins: {
    '@typescript-eslint': tseslint.plugin,
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
  files: ['apps/server/**/*.ts'],
  plugins: {
    '@typescript-eslint': tseslint.plugin,
  },
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
    '@typescript-eslint/no-require-imports': 'off',
    'no-console': 'warn',
  },
};

// AssemblyScript 规则
const hashWASMConfig = {
  files: ['packages/hash-wasm/assembly/**/*.ts'],
  plugins: {
    '@typescript-eslint': tseslint.plugin,
  },
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: './packages/hash-wasm/assembly/tsconfig.json',
    },
  },
  rules: {
    'no-var': 'error',
    'no-prototype-builtins': 'error', // 不支持原型方法
    'no-eval': 'error', // 不支持 eval
    // AssemblyScript 中受限制的 this 用法
    '@typescript-eslint/no-this-alias': 'error',

    // typescript-eslint 规则
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',

    // AssemblyScript 特有规则
    // 强制使用明确的类型（因为 AssemblyScript 不支持类型推断）
    '@typescript-eslint/typedef': [
      'error',
      {
        arrayDestructuring: true,
        arrowParameter: true,
        memberVariableDeclaration: true,
        objectDestructuring: true,
        parameter: true,
        propertyDeclaration: true,
        variableDeclaration: true,
      },
    ],

    // 优先使用 AssemblyScript 类型，禁止使用包装对象类型
    '@typescript-eslint/no-wrapper-object-types': 'error',

    // 使用 no-restricted-syntax 自定义规则来处理 AssemblyScript 特定类型和限制
    'no-restricted-syntax': [
      'error',
      // 禁止使用闭包捕获局部变量
      // TODO 这个规则有点问题，暂时关闭了
      // {
      //   selector: 'ArrowFunctionExpression[body.type!="BlockStatement"] > Identifier[parent.type!="MemberExpression"]',
      //   message: 'AssemblyScript does not support closures capturing local variables',
      // },

      // 禁止动态属性访问和修改
      // TODO 这个规则有点问题，暂时关闭了
      // {
      //   selector: 'MemberExpression[computed=true]',
      //   message: 'AssemblyScript does not support dynamic property access',
      // },

      // 禁止原型操作
      {
        selector: 'MemberExpression[property.name="prototype"]',
        message: 'AssemblyScript does not support prototypes',
      },

      // 禁止使用arguments对象
      {
        selector: 'Identifier[name="arguments"]',
        message: 'AssemblyScript does not support the arguments object',
      },

      // 禁止使用剩余参数
      {
        selector: 'RestElement',
        message: 'AssemblyScript does not support rest parameters',
      },

      // 禁止使用try/catch/finally
      {
        selector: 'TryStatement',
        message: 'AssemblyScript does not support exception handling (try/catch)',
      },

      // 禁止使用for...of
      {
        selector: 'ForOfStatement',
        message: 'AssemblyScript does not support for...of loops',
      },

      // 禁止使用函数对象方法 (apply, call, bind)
      {
        selector: 'MemberExpression[property.name="apply"]',
        message: 'AssemblyScript does not support Function.prototype.apply',
      },
      {
        selector: 'MemberExpression[property.name="call"]',
        message: 'AssemblyScript does not support Function.prototype.call',
      },
      {
        selector: 'MemberExpression[property.name="bind"]',
        message: 'AssemblyScript does not support Function.prototype.bind',
      },

      // 禁止使用反射 API
      {
        selector: 'MemberExpression[object.name="Reflect"]',
        message: 'AssemblyScript does not support the Reflect API',
      },
      {
        selector: 'MemberExpression[object.name="Proxy"]',
        message: 'AssemblyScript does not support the Proxy API',
      },
      {
        selector: 'NewExpression[callee.name="Proxy"]',
        message: 'AssemblyScript does not support the Proxy constructor',
      },

      // 禁止使用动态 import()
      {
        selector: 'ImportExpression',
        message: 'AssemblyScript does not support dynamic imports',
      },

      // 禁止解构赋值中使用剩余元素
      {
        selector: 'ObjectPattern > RestElement',
        message: 'AssemblyScript does not support object rest destructuring',
      },
      {
        selector: 'ArrayPattern > RestElement',
        message: 'AssemblyScript does not support array rest destructuring',
      },

      // 禁止使用Promise, async/await
      {
        selector: 'NewExpression[callee.name="Promise"]',
        message: 'AssemblyScript does not support Promise',
      },
      {
        selector: 'AwaitExpression',
        message: 'AssemblyScript does not support await',
      },
      {
        selector: 'FunctionDeclaration[async=true]',
        message: 'AssemblyScript does not support async functions',
      },
      {
        selector: 'FunctionExpression[async=true]',
        message: 'AssemblyScript does not support async functions',
      },
      {
        selector: 'ArrowFunctionExpression[async=true]',
        message: 'AssemblyScript does not support async arrow functions',
      },
    ],

    // 禁止隐式类型转换
    'no-implicit-coercion': 'error',

    // 禁止删除变量
    'no-delete-var': 'error',

    // 禁止在AssemblyScript中使用特定的JS全局对象
    'no-restricted-globals': [
      'error',
      {
        name: 'document',
        message: 'DOM APIs like document are not available in AssemblyScript',
      },
      {
        name: 'window',
        message: 'Browser APIs like window are not available in AssemblyScript',
      },
      {
        name: 'console',
        message: 'console is not available in AssemblyScript, use trace() instead',
      },
      {
        name: 'setTimeout',
        message: 'setTimeout is not available in AssemblyScript',
      },
      {
        name: 'fetch',
        message: 'fetch API is not available in AssemblyScript',
      },
    ],

    // 强制使用 === 和 !==
    eqeqeq: 'error',

    // 禁止使用 with 语句 (AssemblyScript 不支持)
    'no-with': 'error',

    // 禁止使用特定正则表达式语法 (AssemblyScript 不支持)
    'no-regex-spaces': 'error',

    // 禁用 __proto__ (AssemblyScript 没有原型链)
    'no-proto': 'error',

    // 禁用 caller/callee (AssemblyScript 不支持)
    'no-caller': 'error',

    // 禁止修改类声明的变量 (AssemblyScript 中类不能作为值使用)
    'no-class-assign': 'error',

    // 禁止直接修改函数参数
    'no-param-reassign': 'error',

    // 禁止使用 eval 及其变种
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // 禁止使用 instanceof 操作符 (除非用于内置类型)
    'no-restricted-properties': [
      'error',
      {
        property: 'instanceof',
        message: 'AssemblyScript has limited support for instanceof',
      },

      // 字符串动态方法限制
      {
        object: 'String',
        property: 'raw',
        message: 'Not supported in AssemblyScript',
      },
    ], // 自定义警告规则：提醒检查内存管理
    'spaced-comment': [
      'warn',
      'always',
      {
        line: {
          markers: ['/'],
          exceptions: ['-', '+', '='],
        },
        block: {
          markers: ['!', '*'],
          exceptions: ['*'],
          balanced: true,
        },
      },
    ],
  },
};

export default tseslint.config(
  // 主规则
  {
    ignores,
  },
  // 基础推荐配置
  eslint.configs.recommended,
  tseslint.configs.recommended,
  // 通用配置
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: eslintPrettier,
      'simple-import-sort': importSort,
    },
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'error',
    },
  },
  // 其他规则
  frontendConfig,
  backendConfig,
  hashWASMConfig
);
