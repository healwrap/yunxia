# 云匣 YunXia

1. 是一个基于 JS 的 云盘项目

- apps是 应用项目目录
- packages 是核心功能目录

packages 是核心功能库目录

- core 是核心功能库

然后我们在各个子包中 使用 `pnpm- init` 初始化子包，生成 `package.json` 文件。

创建pnpm工作区配置文件` pnpm-workspace.yaml` 文件，它是用来指定子包的，内容如下：

```yaml
packages:
  - apps/*
  - packages/*
```

2. 我的项目叫云匣 ，所以我们可以定义我们每个子包的名字规范：`@yunxia/xxx`
   不要忘了，我们的根目录也需要初始化一下，它可以作为一个项目的整体入口

3. 我们其实还可以指定项目的node版本和register源
   可以写在`.nvmrc`和`.npmrc`文件中
   或者`packeage.json`的`engines`和`publishConfig`文件下

# 开始安装依赖

1. 首先是工程化相关依赖

- eslint 校验语法规范的

```json
"@eslint/js": "9.32.0",
"eslint": "9.32.0",
"eslint-plugin-prettier": "5.5.3",
"eslint-plugin-react-hooks": "^5.2.0",
"eslint-plugin-react-refresh": "0.4.20",
"eslint-plugin-simple-import-sort": "12.1.1",
"typescript-eslint": "8.38.0"
```

- prettier 校验代码格式

```json
"prettier": "3.6.2",
```

- lint-staged git commit 之前，对暂存区代码进行校验

```json
"lint-staged": "16.1.2",
```

- husky 给git钩子添加脚本

```json
"husky": "9.1.7",
```

- commitlint 校验 commit 是否符合规范

```json
"@commitlint/cli": "19.8.1",
"@commitlint/config-conventional": "19.8.1",
"commitizen": "4.3.1",
```

- cspell 校验项目中的名字是否拼写正确

```json
"cspell": "9.2.0",
```

- cz-git 生成规范的 commit 信息

```json
"cz-git": "1.12.0",
```

- 其他工程依赖

```json
"rimraf": "6.0.1",
"tsup": "8.5.0",
"turbo": "2.5.5",
"npm-run-all2": "8.0.4",
"globals": "16.3.0",
"fast-glob": "3.3.3",
```

2. 配eslint.config.js文件
3. 配prettierrc文件（对应的ignore文件可选）
4. 配commitlint.config.js文件

5. package.json配置文件

- lintStage(在git提交的时候格式化，检查和修复代码)
- config - commitizen 配置 cz-git 也就是可以用这个命令生成 commit

6. 配置以下文件用于指定前后端的一些规则

- tsconfig.client.json
- tsconfig.server.json
- tsconfig.json 前后端项目的共同规则

7. 配置turbo.json文件
   用来快速启动所有项目

8. 添加了好多命令

9. 初始化项目得到husky文件夹，再创两个文件
   `commit-msg`
   用于校验commit提交信息
   `pre-commit`
   用来校验暂存区的文件
