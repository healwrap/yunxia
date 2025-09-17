import { RocketOutlined } from '@ant-design/icons';
import { Github, Play } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import AnimatedSection from '@/components/AnimatedSection';
import MagicBento from '@/components/MagicBento';
import Silk from '@/components/Silk';
import TextType from '@/components/TextType';
import { GalaxyHeroContent } from '@/components/ui/galaxy-hero-content';
import { GalaxyNavbar } from '@/components/ui/galaxy-navbar';
import { SplineBackground } from '@/components/ui/spline-background';

export default function HomePage() {
  const navigate = useNavigate();
  const screenshotRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (screenshotRef.current && heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset;
          if (screenshotRef.current) {
            screenshotRef.current.style.transform = `translateY(-${scrollPosition * 0.5}px)`;
          }

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
              label: '功能',
              href: '#features',
              children: [
                { label: '分片上传', href: '#upload' },
                { label: '秒传技术', href: '#instant' },
                { label: '安全共享', href: '#share' },
              ],
            },
            { key: 'docs', label: '文档', href: '/docs' },
            {
              key: 'github',
              label: (
                <div className="flex items-center space-x-1">
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
                { value: '99.9%', label: '服务可用性' },
                { value: '10GB', label: '免费存储空间' },
                { value: '256位', label: 'AES加密保护' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Screenshot/Preview Section */}
      <div className="bg-black relative z-10" style={{ marginTop: '-10vh' }}>
        <section className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 mt-11 md:mt-12">
          <div
            ref={screenshotRef}
            className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700/50 w-full md:w-[80%] lg:w-[70%] mx-auto"
          >
            <div>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=3840&h=2160&q=80&auto=format&fit=crop"
                alt="YunXia 云匣 Dashboard Screenshot"
                className="w-full h-auto block rounded-lg mx-auto"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 px-4 bg-gradient-to-b from-black to-slate-900">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <AnimatedSection direction="up" delay={200}>
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-6">
                  ✨ 核心特性
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  为什么选择
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {' '}
                    云匣
                  </span>
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  基于现代Web技术构建，提供企业级的云存储解决方案
                </p>
              </div>
            </AnimatedSection>

            {/* Features Grid */}
            <AnimatedSection direction="up" delay={400}>
              <div className="w-full flex justify-center">
                <MagicBento
                  cards={[
                    {
                      color: '#0f172a',
                      title: '智能分片上传',
                      description: '先进的分片上传技术，支持大文件断点续传，确保上传稳定可靠',
                      label: '核心技术',
                    },
                    {
                      color: '#0f172a',
                      title: '秒传黑科技',
                      description: 'MD5哈希校验，相同文件瞬间完成上传，节省时间和带宽',
                      label: '智能识别',
                    },
                    {
                      color: '#0f172a',
                      title: '安全共享',
                      description: '支持密码保护和时效控制的文件分享，数据安全有保障',
                      label: '隐私保护',
                    },
                    {
                      color: '#0f172a',
                      title: '空间管理',
                      description: '智能存储空间管理，回收站机制，让您的数据井井有条',
                      label: '高效管理',
                    },
                    {
                      color: '#0f172a',
                      title: '多端同步',
                      description: '跨平台支持，随时随地访问您的文件，工作生活无缝衔接',
                      label: '便捷访问',
                    },
                    {
                      color: '#0f172a',
                      title: '企业级安全',
                      description: 'Clerk身份认证，256位加密传输，保护您的数据安全',
                      label: '安全可靠',
                    },
                  ]}
                  enableStars={true}
                  enableSpotlight={true}
                  enableBorderGlow={true}
                  enableTilt={false}
                  clickEffect={true}
                  enableMagnetism={false}
                  glowColor="59, 130, 246"
                  spotlightRadius={350}
                  particleCount={15}
                />
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="relative py-24 px-4 bg-black">
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
            <Silk speed={2} scale={0.8} color="#8b5cf6" noiseIntensity={0.5} rotation={45} />
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
