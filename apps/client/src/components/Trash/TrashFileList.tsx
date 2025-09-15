import { DeleteOutlined, FileOutlined, FolderOutlined, RollbackOutlined } from '@ant-design/icons';
import { Button, Checkbox, Space, Table, Typography } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import React from 'react';

import type { TrashFileItem } from '../../lib/api/trash';
import { formatFileSize } from '../../utils/format';

interface TrashFileListProps {
  files: TrashFileItem[];
  loading?: boolean;
  selectedFileIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRestore: (fileIds: string[]) => void;
  onPermanentDelete: (fileIds: string[]) => void;
  pagination?: TablePaginationConfig;
}

const { Text } = Typography;

/**
 * 回收站文件列表组件
 */
export const TrashFileList: React.FC<TrashFileListProps> = ({
  files,
  loading,
  selectedFileIds,
  onSelectionChange,
  onRestore,
  onPermanentDelete,
  pagination,
}) => {
  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(files.map(file => file.id));
    } else {
      onSelectionChange([]);
    }
  };

  // 处理单个文件选择
  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFileIds, fileId]);
    } else {
      onSelectionChange(selectedFileIds.filter(id => id !== fileId));
    }
  };

  // 计算剩余天数
  const getDaysLeft = (deletedAt: string) => {
    const deletedDate = dayjs(deletedAt);
    const now = dayjs();
    const daysLeft = 30 - now.diff(deletedDate, 'day');
    return Math.max(0, daysLeft);
  };

  const columns: ColumnsType<TrashFileItem> = [
    {
      title: (
        <Checkbox
          indeterminate={selectedFileIds.length > 0 && selectedFileIds.length < files.length}
          checked={selectedFileIds.length === files.length && files.length > 0}
          onChange={e => handleSelectAll(e.target.checked)}
        >
          全选
        </Checkbox>
      ),
      width: 80,
      render: (_, file) => (
        <Checkbox
          checked={selectedFileIds.includes(file.id)}
          onChange={e => handleSelectFile(file.id, e.target.checked)}
        />
      ),
    },
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, file) => (
        <Space>
          {file.is_folder ? (
            <FolderOutlined style={{ color: '#1890ff' }} />
          ) : (
            <FileOutlined style={{ color: '#666' }} />
          )}
          <Text ellipsis={{ tooltip: name }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      responsive: ['sm'] as const,
      render: (size: number, file) => (
        <Text type="secondary">{file.is_folder ? '-' : formatFileSize(size)}</Text>
      ),
    },
    {
      title: '删除时间',
      dataIndex: 'deleted_at',
      key: 'deleted_at',
      width: 160,
      responsive: ['md'] as const,
      render: (deletedAt: string) => (
        <Text type="secondary">{dayjs(deletedAt).format('YYYY-MM-DD HH:mm')}</Text>
      ),
    },
    {
      title: '剩余天数',
      key: 'daysLeft',
      width: 100,
      responsive: ['lg'] as const,
      render: (_, file) => {
        const daysLeft = getDaysLeft(file.deleted_at);
        return (
          <Text type={daysLeft <= 7 ? 'danger' : 'secondary'}>
            {daysLeft > 0 ? `${daysLeft} 天` : '即将删除'}
          </Text>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, file) => (
        <Space size={0}>
          <Button
            type="text"
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => onRestore([file.id])}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onPermanentDelete([file.id])}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={files}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      size="small"
      className="responsive-table"
      scroll={{ x: 800 }}
    />
  );
};
