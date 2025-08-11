const fg = require('fast-glob');

const getPackages = packagePath =>
  fg.sync('*', { cwd: packagePath, onlyDirectories: true, deep: 2 });

/**
 * 代码区域，设计的项目名
 */
const scopes = [
  ...getPackages('packages'),
  ...getPackages('apps'),
  ...getPackages('demos'), // TODO 这个之后会加
  'docs',
  'project',
  'style',
  'ci',
  'dev',
  'deploy',
  'other',
];

// JS Doc 可以像 ts 一样提供代码类型提示
/** @type {import('cz-git').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'], // 约定式提交 规范
  parserPreset: 'conventional-changelog-conventionalcommits',
  rules: {
    'scope-enum': [2, 'always', scopes],
  },

  // 以下均为 cz-git 的交互式提交提示配置，需要使用 npm run commit 命令
  prompt: {
    settings: {},
    messages: {
      skip: ':跳过',
      max: '最多 %d 个字符',
      min: '至少 %d 个字符',
      emptyWarning: '不能为空',
      upperLimitWarning: '超出限制',
      lowerLimitWarning: '低于限制',
    },
    types: [
      { value: 'feat', name: 'feat:     ✨  新功能', emoji: '✨ ' },
      { value: 'fix', name: 'fix:      🐛  修复 Bug', emoji: '🐛 ' },
      { value: 'docs', name: 'docs:     📝  仅文档变更', emoji: '📝 ' },
      {
        value: 'style',
        name: 'style:    💄  代码格式（不影响代码运行的变动）',
        emoji: '💄 ',
      },
      {
        value: 'refactor',
        name: 'refactor: 📦️   代码重构（既不是新增功能，也不是修复 bug）',
        emoji: '📦️ ',
      },
      {
        value: 'perf',
        name: 'perf:     🚀  性能优化',
        emoji: '🚀 ',
      },
      {
        value: 'test',
        name: 'test:     🚨  增加或修正测试',
        emoji: '🚨 ',
      },
      {
        value: 'build',
        name: 'build:    🛠   构建流程、外部依赖变更（如升级依赖）',
        emoji: '🛠 ',
      },
      {
        value: 'ci',
        name: 'ci:       🎡  持续集成配置变更',
        emoji: '🎡 ',
      },
      {
        value: 'chore',
        name: 'chore:    🔨  其他不修改 src 或测试文件的变更',
        emoji: '🔨 ',
      },
      { value: 'revert', name: 'revert:   ⏪️  回滚提交', emoji: ':rewind:' },
    ],
    useEmoji: true,
    confirmColorize: true,
    emojiAlign: 'center',
    questions: {
      scope: {
        description: '此次变更的范围（如组件或文件名）',
      },
      subject: {
        description: '简要描述变更内容（使用祈使句）',
      },
      body: {
        description: '详细描述此次变更',
      },
      isBreaking: {
        description: '是否有破坏性变更？',
      },
      breakingBody: {
        description: 'BREAKING CHANGE 类型的提交需要详细描述，请输入更长的说明',
      },
      breaking: {
        description: '请描述破坏性变更内容',
      },
      isIssueAffected: {
        description: '此次变更是否影响到未关闭的 issue？',
      },
      issuesBody: {
        description: '如果关闭了 issue，提交需要详细描述，请输入更长的说明',
      },
      issues: {
        description: '请添加 issue 关联（如 "fix #123", "re #123"）',
      },
    },
  },
};
