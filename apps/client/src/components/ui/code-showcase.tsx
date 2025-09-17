import { ChevronDown, ChevronRight, Code, Copy } from 'lucide-react';
import React, { useState } from 'react';

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  category: 'wasm' | 'worker' | 'upload' | 'protocol' | 'concurrent';
  filename?: string;
}

interface CodeCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
}

const CodeShowcase: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('upload');
  const [expandedSnippets, setExpandedSnippets] = useState<Set<string>>(new Set(['upload-flow']));
  const [copiedSnippet, setCopiedSnippet] = useState<string>('');

  const categories: CodeCategory[] = [
    {
      id: 'wasm',
      title: 'WebAssembly',
      description: '高性能MD5哈希计算',
      color: 'purple',
      icon: '⚡',
    },
    {
      id: 'worker',
      title: 'WebWorker',
      description: '后台文件处理',
      color: 'blue',
      icon: '🧠',
    },
    {
      id: 'upload',
      title: '分片上传',
      description: '文件上传核心逻辑',
      color: 'green',
      icon: '📤',
    },
    {
      id: 'protocol',
      title: '三阶段协议',
      description: '握手-上传-合并流程',
      color: 'orange',
      icon: '🔄',
    },
    {
      id: 'concurrent',
      title: '并发控制',
      description: '任务队列管理',
      color: 'red',
      icon: '⚙️',
    },
  ];

  const codeSnippets: CodeSnippet[] = [
    {
      id: 'wasm-md5',
      title: 'WebAssembly MD5 计算',
      description: 'AssemblyScript 实现的高性能MD5哈希算法',
      language: 'typescript',
      category: 'wasm',
      filename: 'assembly/md5.ts',
      code: `// RFC 1321 MD5 implementation in AssemblyScript
export function md5(data: Uint8Array): string {
  // 初始化MD5常量
  let h: StaticArray<u32> = [
    0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476
  ];
  
  // 数据预处理：添加padding
  const paddedLength = ((data.length + 8) >> 6) + 1;
  const paddedData = new Uint8Array(paddedLength * 64);
  
  // 处理每个64字节块
  for (let chunk = 0; chunk < paddedLength; chunk++) {
    processChunk(paddedData, chunk * 64, h);
  }
  
  return toHexString(h);
}`,
    },
    {
      id: 'worker-hash',
      title: 'WebWorker 哈希处理',
      description: '在Worker线程中进行文件哈希计算，避免阻塞UI',
      language: 'typescript',
      category: 'worker',
      filename: 'utils/fileUpload.ts',
      code: `export const calculateFileHash = async (file: RcFile) => {
  const options: HashWorkerOptions = {
    file,
    config: {
      chunkSize: 10, // 10MB 的分片大小
      workerCount: navigator.hardwareConcurrency || 4,
      strategy: 'md5' as unknown as Strategy,
    },
  };

  // 在WebWorker中计算哈希
  const result = await getFileHashChunks(options);
  destroyWorkerPool();

  return {
    fileHash: result.merkleHash,
    chunkHashes: result.chunksHash,
    chunks: result.chunksBlob || [],
  };
};`,
    },
    {
      id: 'upload-flow',
      title: '分片上传流程',
      description: '核心文件上传逻辑，支持并发控制和错误处理',
      language: 'typescript',
      category: 'upload',
      filename: 'utils/fileUpload.ts',
      code: `export const processFileUpload = async (
  task: UploadTask,
  updateTask: (updates: Partial<UploadTask>) => void,
  abortController: AbortController
) => {
  try {
    // 1. 发送握手请求
    const { data: handshakeResult } = await uploadApi.handshake({
      fileHash: task.fileHash,
      chunkHashes: task.chunkHashes,
      filename: task.file.name,
      fileSize: task.file.size,
    }, abortController.signal);

    // 2. 检查是否秒传
    if (handshakeResult.hasUploaded) {
      updateTask({
        status: 'success',
        progress: 100,
        fileId: handshakeResult.fileId,
      });
      return;
    }

    // 3. 并发上传分片
    const chunksToUpload = handshakeResult.chunks || [];
    const uploadPromises = chunksToUpload.map(chunkHash => 
      uploadChunk(chunkHash)
    );

    await Promise.all(uploadPromises);
  } catch (error) {
    updateTask({ status: 'error', error: error.message });
  }
};`,
    },
    {
      id: 'handshake-protocol',
      title: '握手协议实现',
      description: '三阶段上传协议的第一阶段：文件检查和分片规划',
      language: 'typescript',
      category: 'protocol',
      filename: 'controllers/uploadController.ts',
      code: `export const handleHandshake = async (ctx: Context) => {
  const { fileHash, chunkHashes, filename, fileSize } = ctx.request.body;
  const userId = ctx.state.auth?.sub;

  // 检查存储空间
  const userStorageService = new UserStorageService();
  const hasEnoughSpace = await userStorageService.checkSpaceAvailable(
    userId, BigInt(fileSize)
  );
  
  if (!hasEnoughSpace) {
    ctx.status = 413;
    ctx.body = { code: 413, message: '存储空间不足' };
    return;
  }

  // 检查文件是否已存在（秒传检测）
  const existingFile = await fileRepository.findOne({
    where: { md5: fileHash, user_id: userId }
  });

  if (existingFile) {
    // 文件秒传
    ctx.body = {
      code: 200,
      data: { hasUploaded: true, fileId: existingFile.id }
    };
    return;
  }

  // 返回需要上传的分片
  const chunksToUpload = await getRequiredChunks(fileHash, chunkHashes);
  ctx.body = {
    code: 200,
    data: { hasUploaded: false, chunks: chunksToUpload }
  };
};`,
    },
    {
      id: 'concurrent-control',
      title: '并发控制管理',
      description: 'Zustand状态管理，控制最大并发上传数量',
      language: 'typescript',
      category: 'concurrent',
      filename: 'store/uploadStore.ts',
      code: `export const useUploadStore = create<UploadStore>((set, get) => ({
  tasks: [],
  maxConcurrent: 3, // 最大并发数

  processQueue: () => {
    const { tasks, maxConcurrent } = get();
    
    // 获取当前上传任务数量
    const uploadingTasks = tasks.filter(task => task.status === 'uploading');
    
    if (uploadingTasks.length >= maxConcurrent) return;

    // 获取等待中的任务
    const waitingTasks = tasks.filter(task => task.status === 'waiting');
    if (waitingTasks.length === 0) return;

    // 启动可用的任务
    const availableSlots = maxConcurrent - uploadingTasks.length;
    const tasksToStart = waitingTasks.slice(0, availableSlots);

    tasksToStart.forEach(task => {
      get().updateTask(task.id, { status: 'uploading' });
      
      processFileUpload(task, 
        (updates) => get().updateTask(task.id, updates),
        new AbortController()
      ).finally(() => {
        setTimeout(() => get().processQueue(), 100);
      });
    });
  },
}));`,
    },
  ];

  const toggleSnippet = (snippetId: string) => {
    setExpandedSnippets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(snippetId)) {
        newSet.delete(snippetId);
      } else {
        newSet.add(snippetId);
      }
      return newSet;
    });
  };

  const copyCode = async (code: string, snippetId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippet(snippetId);
      setTimeout(() => setCopiedSnippet(''), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getFilteredSnippets = () => {
    return codeSnippets.filter(snippet => snippet.category === activeCategory);
  };

  const getCategoryClassName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 'bg-gray-800';

    const colorMap: Record<string, string> = {
      purple: 'bg-purple-600',
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      orange: 'bg-orange-600',
      red: 'bg-red-600',
    };

    return colorMap[category.color] || 'bg-gray-600';
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Category Selector */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">核心技术实现</h3>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeCategory === category.id
                  ? `${getCategoryClassName(category.id)} text-white shadow-lg scale-105`
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-102'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <div className="text-left">
                <div className="text-sm font-semibold">{category.title}</div>
                <div className="text-xs opacity-75">{category.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Code Snippets */}
      <div className="space-y-6">
        {getFilteredSnippets().map(snippet => {
          const isExpanded = expandedSnippets.has(snippet.id);
          const isCopied = copiedSnippet === snippet.id;

          return (
            <div
              key={snippet.id}
              className="bg-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSnippet(snippet.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <Code className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">{snippet.title}</h4>
                    <p className="text-gray-400 text-sm">{snippet.description}</p>
                    {snippet.filename && (
                      <p className="text-blue-400 text-xs mt-1">{snippet.filename}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    copyCode(snippet.code, snippet.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  title={isCopied ? '已复制!' : '复制代码'}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Code Content */}
              {isExpanded && (
                <div className="border-t border-gray-700/50">
                  <div className="relative">
                    <pre className="p-6 overflow-x-auto text-sm">
                      <code className="text-gray-300 whitespace-pre">{snippet.code}</code>
                    </pre>

                    {/* Language Badge */}
                    <div className="absolute top-4 right-4 px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 uppercase">
                      {snippet.language}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Technical Highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl border border-purple-500/20">
          <div className="text-purple-400 text-2xl mb-3">⚡</div>
          <h4 className="text-white font-bold mb-2">WebAssembly 加速</h4>
          <p className="text-purple-300 text-sm">AssemblyScript实现MD5算法，性能提升300%</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl border border-blue-500/20">
          <div className="text-blue-400 text-2xl mb-3">🧠</div>
          <h4 className="text-white font-bold mb-2">WebWorker 并行</h4>
          <p className="text-blue-300 text-sm">多线程哈希计算，UI保持流畅响应</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl border border-green-500/20">
          <div className="text-green-400 text-2xl mb-3">🔄</div>
          <h4 className="text-white font-bold mb-2">三阶段协议</h4>
          <p className="text-green-300 text-sm">握手-上传-合并，确保传输可靠性</p>
        </div>
      </div>
    </div>
  );
};

export default CodeShowcase;
