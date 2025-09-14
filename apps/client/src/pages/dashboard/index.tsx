import { FolderAddOutlined, ReloadOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Empty, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import CreateFolderModal from '@/components/FileManagement/CreateFolderModal';
import FileList from '@/components/FileManagement/FileList';
import FileUploader from '@/components/FileManagement/FileUploader';
import RenameModal from '@/components/FileManagement/RenameModal';
import { ShareModal } from '@/components/Share/ShareModal';
import { message } from '@/lib/staticMethodsStore';

import { fileApi, FileItem } from '../../lib/api/file';
import { useAuthToken } from '../../lib/auth';

/**
 * 文件管理容器组件，整合文件上传和文件列表
 */
const DEFAULT_PAGE_SIZE = 15;
function FileManagement() {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId?: string }>();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(folderId);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: '根目录' },
  ]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);

  const { updateRequestToken } = useAuthToken();

  // 加载文件列表
  const loadFiles = async (folderId?: string, page: number = 1, pageSize: number = 20) => {
    try {
      setLoading(true);
      await updateRequestToken();

      const response = await fileApi.getFiles({
        parentId: folderId,
        page,
        pageSize,
      });

      setFiles(response.data.files || []);
      setPagination(response.data.pagination);
    } catch (error) {
      void error;
      setFiles([]);
      setPagination({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载路径信息
  const loadPath = async (folderId?: string) => {
    try {
      if (folderId) {
        await updateRequestToken();
        const response = await fileApi.getFolderPath(folderId);
        setFolderPath(response.data.path);
      } else {
        setFolderPath([{ id: 'root', name: '根目录' }]);
      }
    } catch (error) {
      void error;
      // 路径加载失败，回退到根目录
      setFolderPath([{ id: 'root', name: '根目录' }]);
      navigate('/bench/dashboard');
    }
  };

  // 加载数据
  const loadData = async (folderId?: string, page: number = 1, pageSize: number = 20) => {
    await Promise.all([loadFiles(folderId, page, pageSize), loadPath(folderId)]);
  };

  // 当URL参数改变时，加载数据
  useEffect(() => {
    const loadInitialData = async () => {
      setCurrentFolderId(folderId);

      try {
        setLoading(true);
        await updateRequestToken();

        // 加载文件列表
        const filesResponse = await fileApi.getFiles({
          parentId: folderId,
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
        });

        setFiles(filesResponse.data.files || []);
        setPagination(filesResponse.data.pagination);

        // 加载路径信息
        if (folderId) {
          const pathResponse = await fileApi.getFolderPath(folderId);
          setFolderPath(pathResponse.data.path);
        } else {
          setFolderPath([{ id: 'root', name: '根目录' }]);
        }
      } catch (error) {
        void error;
        setFiles([]);
        setPagination({
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
        });
        setFolderPath([{ id: 'root', name: '根目录' }]);
        if (folderId) {
          navigate('/bench/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  // 刷新文件列表
  const handleRefresh = () => {
    loadData(currentFolderId, pagination.page, pagination.pageSize);
  };

  // 处理文件夹点击
  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    // 更新URL
    navigate(`/bench/dashboard/${folder.id}`);
  };

  // 处理面包屑导航点击
  const handleBreadcrumbClick = (folder: { id: string; name: string }, index: number) => {
    const folderId = folder.id === 'root' ? undefined : folder.id;
    setCurrentFolderId(folderId);
    setFolderPath(prev => prev.slice(0, index + 1));
    // 更新URL
    if (folderId) {
      navigate(`/bench/dashboard/${folderId}`);
    } else {
      navigate('/bench/dashboard');
    }
  };

  // 处理文件预览
  const handlePreview = (file: FileItem) => {
    // 实现文件预览逻辑
    // TODO: 打开预览弹窗或跳转到预览页面
    void file;
  };

  // 处理文件下载
  const handleDownload = async (file: FileItem) => {
    try {
      await updateRequestToken();

      // 获取临时下载链接
      const downloadUrl = await fileApi.downloadFileSimple(file.id);

      // 在新标签页中打开下载链接
      window.open(downloadUrl, '_blank');

      message.success('下载链接已打开，请在新标签页中查看下载状态');
    } catch (error) {
      void error;
      message.error('下载失败');
    }
  };

  // 处理文件分享
  const handleShare = (file: FileItem) => {
    setCurrentFile(file);
    setShareModalVisible(true);
  };

  // 处理文件删除
  const handleDelete = async (file: FileItem) => {
    try {
      await updateRequestToken();
      await fileApi.deleteFiles({ ids: [file.id] });
      message.success('删除成功');
      loadData(currentFolderId, pagination.page, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
      void error;
    }
  };

  // 处理重命名
  const handleRename = (file: FileItem) => {
    setCurrentFile(file);
    setRenameModalVisible(true);
  };

  // 处理新建文件夹
  const handleCreateFolder = () => {
    setCreateFolderVisible(true);
  };

  // 处理创建文件夹成功
  const handleCreateFolderSuccess = () => {
    setCreateFolderVisible(false);
    loadData(currentFolderId, pagination.page, pagination.pageSize);
  };

  // 处理重命名成功
  const handleRenameSuccess = () => {
    setRenameModalVisible(false);
    setCurrentFile(null);
    loadData(currentFolderId, pagination.page, pagination.pageSize);
  };

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || pagination.pageSize;
    loadData(currentFolderId, page, newPageSize);
  };

  return (
    <div>
      {/* 主内容区域 */}
      <div>
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
            <FileUploader parentId={currentFolderId} onUploadSuccess={handleRefresh} />
            <Button icon={<FolderAddOutlined />} onClick={handleCreateFolder}>
              新建文件夹
            </Button>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </div>

        {/* 文件列表 */}
        {files.length > 0 || loading ? (
          <FileList
            files={files}
            loading={loading}
            pagination={pagination}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onShare={handleShare}
            onDelete={handleDelete}
            onRename={handleRename}
            onFolderClick={handleFolderClick}
            onPageChange={handlePageChange}
          />
        ) : (
          <Empty description="暂无文件" className="py-12" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      {/* 创建文件夹模态框 */}
      <CreateFolderModal
        visible={createFolderVisible}
        parentId={currentFolderId}
        onCancel={() => setCreateFolderVisible(false)}
        onSuccess={handleCreateFolderSuccess}
      />

      {/* 重命名模态框 */}
      <RenameModal
        visible={renameModalVisible}
        file={currentFile}
        onCancel={() => setRenameModalVisible(false)}
        onSuccess={handleRenameSuccess}
      />

      {/* 分享模态框 */}
      {currentFile && (
        <ShareModal
          visible={shareModalVisible}
          fileId={currentFile.id}
          fileName={currentFile.name}
          onCancel={() => setShareModalVisible(false)}
          onSuccess={() => {
            setShareModalVisible(false);
            message.success('分享创建成功');
          }}
        />
      )}
    </div>
  );
}

export default FileManagement;
