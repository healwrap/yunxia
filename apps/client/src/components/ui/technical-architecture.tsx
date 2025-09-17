import { Box, Brain, Cpu, Database, Layers, Network, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface TechNode {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  position: { x: number; y: number };
  connections?: string[];
}

interface FlowStep {
  id: string;
  title: string;
  description: string;
  position: { x: number; y: number };
  status: 'idle' | 'active' | 'completed';
}

const TechnicalArchitecture: React.FC = () => {
  const [activeFlow, setActiveFlow] = useState<'upload' | 'hash' | 'storage'>('upload');
  const [flowStep, setFlowStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const techNodes: TechNode[] = [
    {
      id: 'wasm',
      title: 'WebAssembly',
      subtitle: '高性能计算',
      description: '自定义MD5哈希计算模块，提供原生级别的计算性能',
      icon: <Cpu className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      position: { x: 20, y: 20 },
      connections: ['worker'],
    },
    {
      id: 'worker',
      title: 'WebWorker',
      subtitle: '后台处理',
      description: '在独立线程中进行文件哈希计算，避免阻塞UI主线程',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      position: { x: 50, y: 20 },
      connections: ['protocol'],
    },
    {
      id: 'protocol',
      title: '三阶段协议',
      subtitle: '上传管理',
      description: '握手→分片上传→合并完成，确保可靠的文件传输',
      icon: <Network className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      position: { x: 80, y: 20 },
      connections: ['concurrent'],
    },
    {
      id: 'concurrent',
      title: '并发控制',
      subtitle: '任务调度',
      description: '最大3个并发上传任务，智能队列管理系统',
      icon: <Layers className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      position: { x: 20, y: 60 },
      connections: ['storage'],
    },
    {
      id: 'storage',
      title: '存储管理',
      subtitle: '空间优化',
      description: '智能存储空间管理，支持回收站和空间统计',
      icon: <Database className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      position: { x: 50, y: 60 },
      connections: ['instant'],
    },
    {
      id: 'instant',
      title: '秒传检测',
      subtitle: '智能去重',
      description: 'MD5哈希校验，实现文件级别的智能去重和秒传',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      position: { x: 80, y: 60 },
    },
  ];

  const uploadFlow: FlowStep[] = [
    {
      id: 'select',
      title: '文件选择',
      description: '用户选择要上传的文件',
      position: { x: 10, y: 50 },
      status: 'idle',
    },
    {
      id: 'hash',
      title: 'WebWorker 哈希计算',
      description: 'WebWorker + WebAssembly 计算MD5',
      position: { x: 30, y: 20 },
      status: 'idle',
    },
    {
      id: 'handshake',
      title: '握手请求',
      description: '检查文件是否存在，获取分片列表',
      position: { x: 50, y: 50 },
      status: 'idle',
    },
    {
      id: 'upload',
      title: '分片上传',
      description: '并发上传分片，支持断点续传',
      position: { x: 70, y: 20 },
      status: 'idle',
    },
    {
      id: 'complete',
      title: '上传完成',
      description: '合并分片，创建文件记录',
      position: { x: 90, y: 50 },
      status: 'idle',
    },
  ];

  const hashFlow: FlowStep[] = [
    {
      id: 'file',
      title: '文件读取',
      description: '文件对象传入处理流程',
      position: { x: 10, y: 50 },
      status: 'idle',
    },
    {
      id: 'chunk',
      title: '文件分片',
      description: '将文件分割为10MB的块',
      position: { x: 30, y: 30 },
      status: 'idle',
    },
    {
      id: 'wasm',
      title: 'WASM计算',
      description: 'WebAssembly计算每个分片的MD5',
      position: { x: 50, y: 10 },
      status: 'idle',
    },
    {
      id: 'worker',
      title: 'Worker处理',
      description: 'WebWorker后台执行，不阻塞UI',
      position: { x: 70, y: 30 },
      status: 'idle',
    },
    {
      id: 'result',
      title: '哈希结果',
      description: '返回文件MD5和分片哈希数组',
      position: { x: 90, y: 50 },
      status: 'idle',
    },
  ];

  const storageFlow: FlowStep[] = [
    {
      id: 'check',
      title: '空间检查',
      description: '验证用户存储空间是否足够',
      position: { x: 10, y: 40 },
      status: 'idle',
    },
    {
      id: 'temp',
      title: '临时存储',
      description: '分片存储到临时目录',
      position: { x: 30, y: 60 },
      status: 'idle',
    },
    {
      id: 'track',
      title: '状态跟踪',
      description: '维护上传状态文件',
      position: { x: 50, y: 40 },
      status: 'idle',
    },
    {
      id: 'merge',
      title: '文件合并',
      description: '合并分片到最终位置',
      position: { x: 70, y: 60 },
      status: 'idle',
    },
    {
      id: 'update',
      title: '空间更新',
      description: '更新用户存储空间统计',
      position: { x: 90, y: 40 },
      status: 'idle',
    },
  ];

  const getCurrentFlow = () => {
    switch (activeFlow) {
      case 'upload':
        return uploadFlow;
      case 'hash':
        return hashFlow;
      case 'storage':
        return storageFlow;
      default:
        return uploadFlow;
    }
  };

  const flowConfig = {
    upload: { title: '文件上传流程', color: 'blue' },
    hash: { title: '哈希计算流程', color: 'purple' },
    storage: { title: '存储管理流程', color: 'green' },
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAnimating) {
      const currentFlow = getCurrentFlow();
      interval = setInterval(() => {
        setFlowStep(prev => {
          if (prev >= currentFlow.length - 1) {
            setIsAnimating(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnimating, activeFlow]);

  const startAnimation = () => {
    setFlowStep(0);
    setIsAnimating(true);
  };

  const getStepStatus = (index: number): 'idle' | 'active' | 'completed' => {
    if (!isAnimating) return 'idle';
    if (index < flowStep) return 'completed';
    if (index === flowStep) return 'active';
    return 'idle';
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Technology Stack Overview */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-white mb-8 text-center">技术架构总览</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techNodes.map(node => (
            <div
              key={node.id}
              className="group p-6 bg-gray-900/50 rounded-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${node.color} p-3 mb-4`}>
                <div className="w-full h-full flex items-center justify-center text-white">
                  {node.icon}
                </div>
              </div>

              <h4 className="text-lg font-bold text-white mb-1">{node.title}</h4>
              <p className="text-blue-400 text-sm font-medium mb-3">{node.subtitle}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{node.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Flow Diagram */}
      <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700/50">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">交互式流程演示</h3>

          {/* Flow Type Selector */}
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(flowConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveFlow(key as typeof activeFlow);
                  setIsAnimating(false);
                  setFlowStep(0);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeFlow === key
                    ? `bg-${config.color}-600 text-white`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {config.title}
              </button>
            ))}
          </div>
        </div>

        {/* Flow Visualization */}
        <div className="relative h-80 bg-gray-800/30 rounded-xl overflow-hidden mb-6">
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* Connection Lines */}
            {getCurrentFlow().map((step, index) => {
              if (index < getCurrentFlow().length - 1) {
                const current = step;
                const next = getCurrentFlow()[index + 1];
                if (!next) return null;
                const status = getStepStatus(index);

                return (
                  <line
                    key={`${step.id}-line`}
                    x1={`${current.position.x}%`}
                    y1={`${current.position.y}%`}
                    x2={`${next.position.x}%`}
                    y2={`${next.position.y}%`}
                    stroke={
                      status === 'completed'
                        ? '#10b981'
                        : status === 'active'
                          ? '#3b82f6'
                          : '#6b7280'
                    }
                    strokeWidth="2"
                    strokeDasharray={status === 'active' ? '5,5' : 'none'}
                    className={status === 'active' ? 'animate-pulse' : ''}
                  />
                );
              }
              return null;
            })}
          </svg>

          {/* Flow Steps */}
          {getCurrentFlow().map((step, index) => {
            const status = getStepStatus(index);

            return (
              <div
                key={step.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${step.position.x}%`,
                  top: `${step.position.y}%`,
                  zIndex: 2,
                }}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-500 ${
                    status === 'completed'
                      ? 'bg-green-600 scale-110'
                      : status === 'active'
                        ? 'bg-blue-600 scale-125 animate-pulse'
                        : 'bg-gray-600'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-32 text-center">
                  <div className="text-white text-xs font-semibold mb-1">{step.title}</div>
                  <div className="text-gray-400 text-xs leading-tight">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setIsAnimating(false);
              setFlowStep(0);
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            重置
          </button>
          <button
            onClick={startAnimation}
            disabled={isAnimating}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isAnimating
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isAnimating ? '演示中...' : '开始演示'}
          </button>
        </div>
      </div>

      {/* Technical Highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-gray-900/30 rounded-xl border border-gray-700/30">
          <Box className="w-10 h-10 text-purple-500 mx-auto mb-3" />
          <h4 className="text-white font-semibold mb-2">WebAssembly 优化</h4>
          <p className="text-gray-400 text-sm">原生级别的MD5计算性能，相比纯JS实现提升300%</p>
        </div>

        <div className="text-center p-6 bg-gray-900/30 rounded-xl border border-gray-700/30">
          <Brain className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <h4 className="text-white font-semibold mb-2">WebWorker 并行</h4>
          <p className="text-gray-400 text-sm">后台哈希计算，支持多核并行处理，UI保持流畅响应</p>
        </div>

        <div className="text-center p-6 bg-gray-900/30 rounded-xl border border-gray-700/30">
          <Network className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h4 className="text-white font-semibold mb-2">智能协议</h4>
          <p className="text-gray-400 text-sm">三阶段上传协议，支持秒传、断点续传和错误恢复</p>
        </div>
      </div>
    </div>
  );
};

export default TechnicalArchitecture;
