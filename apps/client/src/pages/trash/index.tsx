import { ClearOutlined, ReloadOutlined, RollbackOutlined } from '@ant-design/icons';
import { Button, Empty, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { TrashFileList } from '@/components/Trash/TrashFileList';
import { message, modal } from '@/lib/staticMethodsStore';

import { trashApi, TrashFileItem } from '../../lib/api/trash';

const { Text } = Typography;

/**
 * 回收站页面组件
 */
const DEFAULT_PAGE_SIZE = 15;

function TrashPage() {
  const [files, setFiles] = useState<TrashFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  // 加载回收站文件列表
  const loadTrashFiles = async (page = 1, pageSize = DEFAULT_PAGE_SIZE) => {
    try {
      setLoading(true);

      const response = await trashApi.getTrashFiles({ page, pageSize });

      if (response.code === 200) {
        setFiles(response.data.files);
        setPagination({
          page: response.data.pagination.current,
          pageSize: response.data.pagination.pageSize,
          total: response.data.pagination.total,
        });
      } else {
        message.error(response.message || '获取回收站文件失败');
      }
    } catch {
      message.error('获取回收站文件失败');
    } finally {
      setLoading(false);
    }
  };

  // 恢复文件
  const handleRestoreFiles = async (fileIds: string[]) => {
    try {
      const response = await trashApi.restoreFiles({ ids: fileIds });

      if (response.code === 200) {
        message.success(`成功恢复 ${response.data.restoredCount} 个文件`);
        setSelectedFileIds([]);
        await loadTrashFiles(pagination.page, pagination.pageSize);
      } else {
        message.error(response.message || '恢复文件失败');
      }
    } catch {
      message.error('恢复文件失败');
    }
  };

  // 永久删除文件
  const handlePermanentDelete = async (fileIds: string[]) => {
    modal.confirm({
      title: '确认永久删除',
      content: `您确定要永久删除这 ${fileIds.length} 个文件吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await trashApi.clearTrash({ ids: fileIds });

          if (response.code === 200) {
            message.success(`成功删除 ${response.data.deletedCount} 个文件`);
            setSelectedFileIds([]);
            await loadTrashFiles(pagination.page, pagination.pageSize);
          } else {
            message.error(response.message || '删除文件失败');
          }
        } catch {
          message.error('删除文件失败');
        }
      },
    });
  };

  // 清空回收站
  const handleClearTrash = async () => {
    modal.confirm({
      title: '确认清空回收站',
      content: '您确定要清空整个回收站吗？所有文件将被永久删除，此操作不可撤销。',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await trashApi.clearTrash();

          if (response.code === 200) {
            message.success(`成功清空回收站，删除了 ${response.data.deletedCount} 个文件`);
            setSelectedFileIds([]);
            await loadTrashFiles(1, pagination.pageSize);
          } else {
            message.error(response.message || '清空回收站失败');
          }
        } catch {
          message.error('清空回收站失败');
        }
      },
    });
  };

  // 处理选择变化
  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedFileIds(selectedIds);
  };

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    loadTrashFiles(page, pageSize || pagination.pageSize);
  };

  // 页面加载时获取文件列表
  useEffect(() => {
    loadTrashFiles();
  }, []);

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadTrashFiles(pagination.page, pagination.pageSize)}
              loading={loading}
              size="small"
            >
              刷新
            </Button>
            {files.length > 0 && (
              <Button
                danger
                icon={<ClearOutlined />}
                onClick={handleClearTrash}
                disabled={loading}
                size="small"
              >
                清空回收站
              </Button>
            )}
          </Space>
        </div>

        {/* 批量操作按钮 */}
        {selectedFileIds.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Text>已选择 {selectedFileIds.length} 个文件</Text>
              <Space wrap size="small">
                <Button
                  type="primary"
                  icon={<RollbackOutlined />}
                  onClick={() => handleRestoreFiles(selectedFileIds)}
                  size="small"
                />
                <Button
                  danger
                  icon={<ClearOutlined />}
                  onClick={() => handlePermanentDelete(selectedFileIds)}
                  size="small"
                />
              </Space>
            </div>
          </div>
        )}
      </div>

      {/* 文件列表 */}
      {files.length === 0 && !loading ? (
        <Empty description="回收站为空" imageStyle={{ height: 100 }} />
      ) : (
        <TrashFileList
          files={files}
          loading={loading}
          selectedFileIds={selectedFileIds}
          onSelectionChange={handleSelectionChange}
          onRestore={handleRestoreFiles}
          onPermanentDelete={handlePermanentDelete}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `${range[0]}-${range[1]} / 共 ${total} 个文件`,
          }}
        />
      )}
    </div>
  );
}

export default TrashPage;
