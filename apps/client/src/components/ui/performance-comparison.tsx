import { ArrowRight, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ComparisonMetric {
  id: string;
  title: string;
  traditional: {
    value: number | string;
    unit: string;
    description: string;
    color: string;
  };
  yunxia: {
    value: number | string;
    unit: string;
    description: string;
    color: string;
  };
  improvement: string;
  icon: React.ReactNode;
}

const PerformanceComparison: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<string>('speed');
  const [animatedValues, setAnimatedValues] = useState<Record<string, number | string>>({});

  const metrics: ComparisonMetric[] = [
    {
      id: 'speed',
      title: '10G文件上传',
      traditional: {
        value: 140,
        unit: '秒 (百度网盘桌面版)',
        description: '10G文件上传耗时2分20秒',
        color: 'text-red-400',
      },
      yunxia: {
        value: 13,
        unit: '秒 (云匣网页版)',
        description: '分片并发上传，速度提升显著',
        color: 'text-green-400',
      },
      improvement: '10.8倍提升',
      icon: <Zap className="w-6 h-6" />,
    },
    {
      id: 'medium_file',
      title: '5G文件上传',
      traditional: {
        value: 'N/A',
        unit: '阿里云OSS限制',
        description: '单文件最大5G，无法上传更大文件',
        color: 'text-red-400',
      },
      yunxia: {
        value: 5,
        unit: '秒',
        description: '分片技术突破文件大小限制',
        color: 'text-green-400',
      },
      improvement: '无限制',
      icon: <TrendingUp className="w-6 h-6" />,
    },
    {
      id: 'web_limit',
      title: '网页版限制',
      traditional: {
        value: 4,
        unit: 'GB (百度网盘网页版)',
        description: '网页版最大支持4G文件上传',
        color: 'text-red-400',
      },
      yunxia: {
        value: '无限制',
        unit: '理论上无限大',
        description: '分片技术突破浏览器文件限制',
        color: 'text-green-400',
      },
      improvement: '突破限制',
      icon: <CheckCircle className="w-6 h-6" />,
    },
    {
      id: 'resume',
      title: '断点续传',
      traditional: {
        value: '不支持',
        unit: '夸克网页版',
        description: '网络中断需重新上传',
        color: 'text-red-400',
      },
      yunxia: {
        value: '完整支持',
        unit: '智能恢复',
        description: '断网自动恢复，已上传分片保留',
        color: 'text-green-400',
      },
      improvement: '体验提升',
      icon: <Clock className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      const newValues: Record<string, number | string> = {};
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
          <h4 className="text-white font-bold text-lg mb-2">10.8倍速度提升</h4>
          <p className="text-blue-300 text-sm">10G文件：2min20s → 13s</p>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl border border-green-500/20">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h4 className="text-white font-bold text-lg mb-2">突破文件限制</h4>
          <p className="text-green-300 text-sm">无文件大小限制</p>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl border border-purple-500/20">
          <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h4 className="text-white font-bold text-lg mb-2">领先网页体验</h4>
          <p className="text-purple-300 text-sm">超越传统网盘限制</p>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-xl border border-orange-500/20">
          <Clock className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <h4 className="text-white font-bold text-lg mb-2">完整断点续传</h4>
          <p className="text-orange-300 text-sm">智能恢复机制</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceComparison;
