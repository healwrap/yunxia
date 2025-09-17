import { ArrowRight, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ComparisonMetric {
  id: string;
  title: string;
  traditional: {
    value: number;
    unit: string;
    description: string;
    color: string;
  };
  yunxia: {
    value: number;
    unit: string;
    description: string;
    color: string;
  };
  improvement: string;
  icon: React.ReactNode;
}

const PerformanceComparison: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<string>('speed');
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  const metrics: ComparisonMetric[] = [
    {
      id: 'speed',
      title: '上传速度',
      traditional: {
        value: 100,
        unit: 'MB/min',
        description: '单线程上传，受网络波动影响',
        color: 'text-red-400',
      },
      yunxia: {
        value: 300,
        unit: 'MB/min',
        description: '并发分片上传，充分利用带宽',
        color: 'text-green-400',
      },
      improvement: '3倍提升',
      icon: <Zap className="w-6 h-6" />,
    },
    {
      id: 'reliability',
      title: '网络容错',
      traditional: {
        value: 30,
        unit: '% 成功率',
        description: '网络中断需重新上传',
        color: 'text-red-400',
      },
      yunxia: {
        value: 98,
        unit: '% 成功率',
        description: '断点续传，错误自动恢复',
        color: 'text-green-400',
      },
      improvement: '3.3倍提升',
      icon: <CheckCircle className="w-6 h-6" />,
    },
    {
      id: 'duplication',
      title: '重复文件处理',
      traditional: {
        value: 60,
        unit: '秒',
        description: '每次都需要完整上传',
        color: 'text-red-400',
      },
      yunxia: {
        value: 0.5,
        unit: '秒',
        description: 'MD5校验，瞬间秒传',
        color: 'text-green-400',
      },
      improvement: '120倍提升',
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      id: 'experience',
      title: '用户体验',
      traditional: {
        value: 60,
        unit: '% 满意度',
        description: 'UI阻塞，响应缓慢',
        color: 'text-red-400',
      },
      yunxia: {
        value: 95,
        unit: '% 满意度',
        description: 'WebWorker后台处理，流畅响应',
        color: 'text-green-400',
      },
      improvement: '1.6倍提升',
      icon: <Clock className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      const newValues: Record<string, number> = {};
      metrics.forEach(metric => {
        newValues[`traditional-${metric.id}`] = metric.traditional.value;
        newValues[`yunxia-${metric.id}`] = metric.yunxia.value;
      });
      setAnimatedValues(newValues);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getAnimatedValue = (key: string) => {
    return animatedValues[key] || 0;
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Metrics Comparison */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-white mb-8 text-center">性能对比数据</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {metrics.map(metric => (
            <div
              key={metric.id}
              className={`p-6 bg-gray-900/50 rounded-2xl border transition-all duration-300 cursor-pointer ${
                activeMetric === metric.id
                  ? 'border-blue-500/50 bg-gray-800/50'
                  : 'border-gray-700/50 hover:border-gray-600/50'
              }`}
              onClick={() => setActiveMetric(metric.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400">
                    {metric.icon}
                  </div>
                  <h4 className="text-xl font-bold text-white">{metric.title}</h4>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-lg">{metric.improvement}</div>
                  <div className="text-gray-400 text-sm">性能提升</div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Traditional */}
                <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-500/20">
                  <div>
                    <div className="text-red-400 font-semibold">传统方式</div>
                    <div className="text-gray-400 text-sm">{metric.traditional.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${metric.traditional.color}`}>
                      {getAnimatedValue(`traditional-${metric.id}`)}
                    </div>
                    <div className="text-gray-400 text-sm">{metric.traditional.unit}</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>

                {/* YunXia */}
                <div className="flex items-center justify-between p-4 bg-green-900/20 rounded-lg border border-green-500/20">
                  <div>
                    <div className="text-green-400 font-semibold">云匣方案</div>
                    <div className="text-gray-400 text-sm">{metric.yunxia.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${metric.yunxia.color}`}>
                      {getAnimatedValue(`yunxia-${metric.id}`)}
                    </div>
                    <div className="text-gray-400 text-sm">{metric.yunxia.unit}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Benefits Summary */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl border border-blue-500/20">
          <Zap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h4 className="text-white font-bold text-lg mb-2">3倍上传速度</h4>
          <p className="text-blue-300 text-sm">并发分片上传技术</p>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl border border-green-500/20">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h4 className="text-white font-bold text-lg mb-2">98% 成功率</h4>
          <p className="text-green-300 text-sm">断点续传容错机制</p>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl border border-purple-500/20">
          <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h4 className="text-white font-bold text-lg mb-2">120倍秒传</h4>
          <p className="text-purple-300 text-sm">智能重复文件检测</p>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-xl border border-orange-500/20">
          <Clock className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <h4 className="text-white font-bold text-lg mb-2">流畅体验</h4>
          <p className="text-orange-300 text-sm">WebWorker 后台处理</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceComparison;
