import { CloudUploadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { RcFile } from 'antd/es/upload';
import React, { useEffect, useRef, useState } from 'react';

import { message } from '@/lib/staticMethodsStore';

import { useUploadStore } from '../../store/uploadStore';
import { calculateFileHash } from '../../utils/fileUpload';

interface FileUploaderProps {
  className?: string;
  parentId?: string; // 添加父文件夹ID属性
  onUploadSuccess?: () => void; // 添加上传成功回调
}

/**
 * 文件上传组件，处理文件选择和预处理
 */
const FileUploader: React.FC<FileUploaderProps> = ({ className, parentId, onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const addUploadTask = useUploadStore(state => state.addTask);
  const processQueue = useUploadStore(state => state.processQueue);
  const addUploadCompleteCallback = useUploadStore(state => state.addUploadCompleteCallback);
  const removeUploadCompleteCallback = useUploadStore(state => state.removeUploadCompleteCallback);

  // 注册上传完成回调
  useEffect(() => {
    if (onUploadSuccess) {
      addUploadCompleteCallback(onUploadSuccess);
      return () => {
        removeUploadCompleteCallback(onUploadSuccess);
      };
    }
    return undefined;
  }, [onUploadSuccess, addUploadCompleteCallback, removeUploadCompleteCallback]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    try {
      setUploading(true);
      message.loading({ content: '正在计算文件哈希...', key: 'fileHash' });

      // 计算文件哈希和分片
      const { fileHash, chunkHashes, chunks } = await calculateFileHash(file as RcFile);

      message.success({ content: '文件哈希计算完成!', key: 'fileHash' });

      // 创建上传任务
      addUploadTask({
        file: file as RcFile,
        fileHash,
        chunkHashes,
        chunks,
        totalChunks: chunks.length,
        parentId, // 传递父文件夹ID
      });

      // 自动处理上传队列
      processQueue();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      message.error(`文件处理失败: ${errorMessage}`);
    } finally {
      setUploading(false);
      // 重置文件输入以允许选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = () => {
    // 直接触发隐藏的文件输入点击
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <Button
        type="primary"
        icon={<CloudUploadOutlined />}
        loading={uploading}
        onClick={triggerUpload}
      >
        上传文件
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="*/*"
      />
    </div>
  );
};

export default FileUploader;
