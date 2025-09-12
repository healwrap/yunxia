import { FolderAddOutlined, ReloadOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Empty, Space } from 'antd';
import { useEffect, useState } from 'react';

import FileList, { FileItem } from '@/components/FileManagement/FileList';
import FileUploader from '@/components/FileManagement/FileUploader';

// import { withAuth } from '@/lib/withAuth';
import { uploadApi } from '../../lib/api/upload';
import { useAuthToken } from '../../lib/auth';

interface FileManagementProps {
  className?: string;
}

/**
 * 文件管理容器组件，整合文件上传和文件列表
 */

function FileManagement({ className }: FileManagementProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: '根目录' },
  ]);

  const { updateRequestToken } = useAuthToken();

  // 加载文件列表
  const loadFiles = async (folderId?: string) => {
    try {
      setLoading(true);
      // 获取并设置最新的token
      await updateRequestToken();
      const data = await uploadApi.getFileList(folderId);
      setFiles(data.items || []);
    } catch {
      // 加载文件列表失败，暂时不做处理
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadFiles(currentFolderId);
  }, [currentFolderId]);

  // 刷新文件列表
  const handleRefresh = () => {
    loadFiles(currentFolderId);
  };

  // 处理文件夹点击
  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  // 处理面包屑导航点击
  const handleBreadcrumbClick = (folder: { id: string; name: string }, index: number) => {
    const folderId = folder.id === 'root' ? undefined : folder.id;
    setCurrentFolderId(folderId);
    setFolderPath(prev => prev.slice(0, index + 1));
  };

  // 处理文件预览
  const handlePreview = (file: FileItem) => {
    // 实现文件预览逻辑
    // TODO: 打开预览弹窗或跳转到预览页面
    void file;
  };

  // 处理文件下载
  const handleDownload = (file: FileItem) => {
    // 实现文件下载逻辑
    // TODO: 实现文件下载
    window.open(`/api/files/${file.id}/download`, '_blank');
  };

  // 处理文件分享
  const handleShare = (file: FileItem) => {
    // 实现文件分享逻辑
    // TODO: 打开分享弹窗
    void file;
  };

  // 处理文件删除
  const handleDelete = (file: FileItem) => {
    // 实现文件删除逻辑
    // TODO: 实现删除文件/文件夹
    void file;
    // 删除后刷新列表
    // loadFiles(currentFolderId);
  };

  // 处理新建文件夹
  const handleCreateFolder = () => {
    // 实现新建文件夹逻辑
    // TODO: 实现新建文件夹
    // 创建成功后刷新列表
    // loadFiles(currentFolderId);
  };

  return (
    <div className={className}>
      {/* 面包屑导航 */}
      <div className="mb-4">
        <Breadcrumb>
          {folderPath.map((folder, index) => (
            <Breadcrumb.Item
              key={folder.id}
              onClick={() => handleBreadcrumbClick(folder, index)}
              className="cursor-pointer"
            >
              {folder.name}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </div>

      {/* 工具栏 */}
      <div className="flex justify-between mb-4">
        <Space>
          <FileUploader />
          <Button icon={<FolderAddOutlined />} onClick={handleCreateFolder}>
            新建文件夹
          </Button>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
      </div>

      {/* 文件列表 */}
      {files.length > 0 ? (
        <FileList
          files={files}
          loading={loading}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={handleDelete}
          onFolderClick={handleFolderClick}
        />
      ) : (
        <Empty description="暂无文件" className="py-12" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
}

// const DashboardPage = withAuth(FileManagement);
// export default DashboardPage;
export default FileManagement;
