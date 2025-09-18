import {
  Bot,
  Brain,
  Code,
  Container,
  GitBranch,
  Monitor,
  Rocket,
  Settings,
  Workflow,
  Zap,
} from 'lucide-react';

import AnimatedSection from '@/components/AnimatedSection';

export default function DevelopmentHighlights() {
  const highlights = [
    {
      icon: <Bot className="w-8 h-8 text-blue-400" />,
      title: 'AI驱动开发',
      subtitle: '95%+ 代码由AI生成',
      description:
        '基于VSCode Copilot + Claude 4模型，仅用两天半时间完成2万+行代码的全栈项目开发，90%的代码都是由AI完成。',
      details: [
        {
          icon: <Brain className="w-5 h-5 text-purple-400" />,
          title: '上下文工程技巧',
          description:
            '精心设计copilot-instructions.md，提供项目背景、技术栈、功能交互、数据模型等完整上下文',
        },
        {
          icon: <Code className="w-5 h-5 text-green-400" />,
          title: '提示词工程技巧',
          description: '遵循GitHub Copilot提示词工程最佳实践，明确指令、提供示例、分解复杂任务',
        },
        {
          icon: <Zap className="w-5 h-5 text-yellow-400" />,
          title: '工具链配合',
          description: '使用context7 MCP获取最新库文档，dbhub MCP操作数据库，图像识别辅助UI还原',
        },
        {
          icon: <Settings className="w-5 h-5 text-orange-400" />,
          title: 'AI友好架构',
          description: '采用React+TailwindCSS+TypeScript等AI训练数据丰富的技术栈，优化代码生成效果',
        },
      ],
      features: ['智能代码生成', '自动bug修复', '性能优化建议', '代码审查'],
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Workflow className="w-8 h-8 text-green-400" />,
      title: '现代化CI/CD',
      subtitle: '容器化部署流程',
      description:
        '基于Docker容器化技术，实现从开发到生产的完整自动化部署流程，支持多环境管理和零停机部署。',
      details: [
        {
          icon: <Container className="w-5 h-5 text-blue-400" />,
          title: 'Docker容器化',
          description: '前后端分离容器化部署，使用多阶段构建优化镜像大小，支持环境隔离和快速扩展',
        },
        {
          icon: <GitBranch className="w-5 h-5 text-purple-400" />,
          title: '自动化构建',
          description:
            'Turbo Repo单仓多包管理，pnpm workspace优化依赖安装，ESLint+Prettier代码规范',
        },
        {
          icon: <Monitor className="w-5 h-5 text-green-400" />,
          title: '环境管理',
          description: '开发、测试、生产环境配置分离，Clerk认证环境变量管理，PostgreSQL数据库迁移',
        },
        {
          icon: <Rocket className="w-5 h-5 text-red-400" />,
          title: '部署策略',
          description: '支持蓝绿部署和滚动更新，Nginx反向代理，SSL证书自动化，CDN静态资源加速',
        },
      ],
      features: ['自动化测试', '代码质量检查', '多环境部署', '回滚机制'],
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-slate-900 to-black">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection direction="up" delay={200}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
              <Rocket className="w-4 h-4" />
              开发亮点
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              现代化
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {' '}
                开发流程
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              基于AI技术和现代DevOps实践，打造高效、可靠的开发与部署体系
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {highlights.map((item, index) => (
            <AnimatedSection key={index} direction="up" delay={300 + index * 100}>
              <div className="relative h-full">
                {/* 背景卡片 */}
                <div className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 backdrop-blur-sm h-full">
                  {/* 顶部图标和标题 */}
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${item.gradient} bg-opacity-10 border border-current border-opacity-20`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                      <p
                        className={`text-sm bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent font-medium`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* 描述 */}
                  <p className="text-gray-300 mb-6 leading-relaxed">{item.description}</p>

                  {/* 详细信息展开 */}
                  {item.details && (
                    <div className="mb-6">
                      <div className="grid gap-4">
                        {item.details.map((detail, detailIndex) => (
                          <div
                            key={detailIndex}
                            className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/20"
                          >
                            <div className="flex-shrink-0 mt-1">{detail.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white mb-1">
                                {detail.title}
                              </h4>
                              <p className="text-xs text-gray-400 leading-relaxed">
                                {detail.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 特性列表 */}
                  <div className="grid grid-cols-2 gap-3">
                    {item.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.gradient}`}
                        ></div>
                        <span className="text-sm text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* 装饰性元素 */}
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
                    <div
                      className={`w-full h-full rounded-full bg-gradient-to-r ${item.gradient}`}
                    ></div>
                  </div>
                </div>

                {/* 发光效果 */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.gradient} opacity-5 blur-xl`}
                ></div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* 额外的统计信息 */}
        <AnimatedSection direction="up" delay={600}>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '95%+', label: 'AI生成代码' },
              { value: '100%', label: '自动化测试' },
              { value: '<5min', label: '部署时间' },
              { value: '24/7', label: '监控运维' },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-xl bg-gray-900/30 border border-gray-700/30"
              >
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
