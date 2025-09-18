import { RocketOutlined } from '@ant-design/icons';
import { Github, Play } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import AnimatedSection from '@/components/AnimatedSection';
// import Silk from '@/components/Silk';
import TextType from '@/components/TextType';
import CodeShowcase from '@/components/ui/code-showcase';
import DevelopmentHighlights from '@/components/ui/development-highlights';
import { GalaxyHeroContent } from '@/components/ui/galaxy-hero-content';
import { GalaxyNavbar } from '@/components/ui/galaxy-navbar';
import PerformanceComparison from '@/components/ui/performance-comparison';
import { SplineBackground } from '@/components/ui/spline-background';
import TechnicalArchitecture from '@/components/ui/technical-architecture';

export default function HomePage() {
  const navigate = useNavigate();
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset;

          const maxScroll = 400;
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
          if (heroContentRef.current) {
            heroContentRef.current.style.opacity = opacity.toString();
          }
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative text-white">
      {/* Galaxy Hero Section */}
      <div className="relative min-h-screen">
        <GalaxyNavbar
          logo={
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">云</span>
              </div>
              <span className="text-white font-bold text-xl">云匣</span>
            </div>
          }
          items={[
            {
              key: 'features',
              label: '功能特性',
              href: '#technology',
            },
            {
              key: 'performance',
              label: '性能对比',
              href: '#performance',
            },
            {
              key: 'highlights',
              label: '开发亮点',
              href: '#development-highlights',
            },
            {
              key: 'implementation',
              label: '代码实现',
              href: '#implementation',
            },
            {
              key: 'tech',
              label: '技术栈',
              href: '#tech-stack',
            },
            {
              key: 'github',
              label: (
                <div className="inline-flex items-center space-x-1">
                  <Github className="w-4 h-4" />
                  <span>开源</span>
                </div>
              ),
              href: 'https://github.com/healwrap/yunxia',
              external: true,
            },
          ]}
          ctaText="立即开始"
          onCtaClick={() => navigate('/bench')}
          secondaryCtaText="登录"
          onSecondaryCtaClick={() => navigate('/bench')}
        />

        {/* Spline Background */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <SplineBackground />
        </div>

        {/* Hero Content */}
        <div
          ref={heroContentRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <div className="container mx-auto">
            <GalaxyHeroContent
              badge={{
                text: '现代云存储解决方案',
                icon: <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>,
              }}
              title={
                <TextType
                  text="云匣 YunXia"
                  className="text-3xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4 leading-tight tracking-wide"
                  typingSpeed={80}
                  pauseDuration={1000}
                  showCursor={true}
                  cursorCharacter="|"
                />
              }
              subtitle="专为现代团队打造的智能云存储平台"
              description="分片上传 • 秒传技术 • 安全共享 • 企业级安全保护，让您的文件管理更加高效便捷。"
              primaryButton={{
                text: '立即开始',
                onClick: () => navigate('/bench'),
              }}
              secondaryButton={{
                text: '在线体验',
                icon: <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />,
                onClick: () => navigate('/bench'),
              }}
              stats={[
                { value: '10GB', label: '免费存储空间' },
                { value: '不限速', label: '上传/下载速度' },
                { value: '体验好', label: '使用最新技术' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="bg-black relative z-10">
        {/* Technical Architecture Section */}
        <section id="technology" className="relative py-24 px-4 bg-black">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection direction="up" delay={200}>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6">
                  🏗️ 技术架构
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  技术
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {' '}
                    创新亮点
                  </span>
                </h2>
                <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                  WebAssembly高性能计算、WebWorker多线程处理、智能并发控制，打造业界领先的技术架构
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={400}>
              <TechnicalArchitecture />
            </AnimatedSection>
          </div>
        </section>

        {/* Performance Comparison Section */}
        <section
          id="performance"
          className="relative py-24 px-4 bg-gradient-to-b from-black to-slate-900"
        >
          <div className="max-w-7xl mx-auto">
            <AnimatedSection direction="up" delay={200}>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm mb-6">
                  📊 性能对比
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  性能
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {' '}
                    优势明显
                  </span>
                </h2>
                <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                  相比传统上传方式，云匣在速度、可靠性、用户体验等方面都有显著提升
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={400}>
              <PerformanceComparison />
            </AnimatedSection>
          </div>
        </section>

        {/* Development Highlights Section */}
        <section
          id="development-highlights"
          className="relative py-24 px-4 bg-gradient-to-b from-slate-900 to-black"
        >
          <DevelopmentHighlights />
        </section>

        {/* Code Implementation Section */}
        <section id="implementation" className="relative py-24 px-4 bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection direction="up" delay={200}>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm mb-6">
                  💻 代码实现
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  核心
                  <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    {' '}
                    代码解析
                  </span>
                </h2>
                <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                  深入了解云匣核心技术的具体实现，包括WebAssembly、WebWorker、三阶段协议等关键代码
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={400}>
              <CodeShowcase />
            </AnimatedSection>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section id="tech-stack" className="relative py-24 px-4 bg-black">
          <div className="max-w-6xl mx-auto text-center">
            <AnimatedSection direction="up" delay={200}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-6">
                🚀 技术架构
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">现代化技术栈</h2>
              <p className="text-lg text-gray-400 mb-16 max-w-2xl mx-auto">
                采用业界领先的技术方案，确保系统的稳定性、安全性和可扩展性
              </p>
            </AnimatedSection>

            {/* Tech Grid */}
            <AnimatedSection direction="up" delay={400}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {[
                  { name: 'React 19', desc: '前端框架', color: 'from-blue-500 to-cyan-500' },
                  { name: 'TypeScript', desc: '类型安全', color: 'from-blue-600 to-blue-700' },
                  { name: 'Koa.js', desc: '后端服务', color: 'from-green-500 to-emerald-500' },
                  { name: 'PostgreSQL', desc: '数据存储', color: 'from-blue-700 to-indigo-700' },
                  { name: 'WebAssembly', desc: '性能优化', color: 'from-purple-500 to-pink-500' },
                  { name: 'TailwindCSS', desc: '样式框架', color: 'from-cyan-500 to-blue-500' },
                  { name: 'Clerk Auth', desc: '身份认证', color: 'from-violet-500 to-purple-500' },
                  { name: 'Turbo Repo', desc: '项目管理', color: 'from-red-500 to-orange-500' },
                ].map((tech, index) => (
                  <div
                    key={index}
                    className="group p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:scale-105"
                  >
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-r ${tech.color} mb-3 md:mb-4 mx-auto opacity-80 group-hover:opacity-100 transition-opacity`}
                    />
                    <h3 className="text-white font-semibold mb-1 text-sm md:text-base">
                      {tech.name}
                    </h3>
                    <p className="text-gray-400 text-xs md:text-sm">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 px-4 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20">
          <div className="absolute inset-0">
            {/* <Silk speed={2} scale={0.8} color="#8b5cf6" noiseIntensity={0.5} rotation={45} /> */}
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <AnimatedSection direction="up" delay={200}>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                准备好体验云匣了吗？
              </h2>
              <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
                立即注册，获得10GB免费存储空间，开启您的云端存储之旅
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => navigate('/bench')}
                  className="bg-[#8200DB29] hover:bg-black/50 text-white font-semibold py-3 px-8 rounded-full transition duration-300 w-full sm:w-auto border border-[#322D36] flex items-center justify-center gap-2"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <RocketOutlined />
                  免费开始使用
                </button>
                <button
                  onClick={() => window.open('https://github.com/healwrap/yunxia', '_blank')}
                  className="bg-[#0009] border border-gray-600 hover:border-gray-400 text-gray-200 hover:text-white font-medium py-3 px-8 rounded-full transition duration-300 w-full sm:w-auto"
                >
                  查看源码
                </button>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black py-12 px-4 border-t border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h3 className="text-xl font-bold text-white mb-2">云匣 YunXia</h3>
                <p className="text-gray-400">现代化云存储解决方案</p>
              </div>
              <div className="flex space-x-6">
                <a href="/docs" className="text-gray-400 hover:text-white transition-colors">
                  文档
                </a>
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  隐私政策
                </a>
                <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  服务条款
                </a>
                <a
                  href="https://github.com/healwrap/yunxia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 text-center text-gray-500">
              <p>&copy; 2025 云匣 YunXia. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
