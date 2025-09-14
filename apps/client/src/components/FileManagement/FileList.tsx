import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileOutlined,
  FolderOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Button, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';

import { modal } from '@/lib/staticMethodsStore';

import { formatFileSize } from '../../utils/format';

export interface FileItem {
  id: string;
  parentId?: string;
  name: string;
  size: number;
  type: string;
  isFolder: boolean;
  path: string;
  md5?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface FileListProps {
  files: FileItem[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPreview?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onShare?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onFolderClick?: (folder: FileItem) => void;
  onPageChange?: (page: number, pageSize?: number) => void;
}

/**
 * 文件列表组件，展示文件列表和提供操作按钮
 */
const FileList: React.FC<FileListProps> = ({
  files,
  loading = false,
  pagination,
  onPreview,
  onDownload,
  onDelete,
  onShare,
  onRename,
  onFolderClick,
  onPageChange,
}) => {
  // 获取文件图标
  const getFileIcon = (file: FileItem) => {
    if (file.isFolder) return <FolderOutlined className="text-blue-500" />;

    return <FileOutlined className="text-gray-500" />;
  };

  // 删除确认处理函数
  const handleDeleteConfirm = (record: FileItem) => {
    modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <div>确定要删除 "{record.name}" 吗？</div>
          {record.isFolder && (
            <div className="text-gray-500 mt-1">文件夹内的所有内容也将被删除</div>
          )}
        </div>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        onDelete?.(record);
      },
    });
  };

  const columns: ColumnsType<FileItem> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FileItem) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={() => record.isFolder && onFolderClick?.(record)}
        >
          <span className="mr-2">{getFileIcon(record)}</span>
          <Typography.Text strong ellipsis={{ tooltip: text }} className="max-w-md">
            {text}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number, record: FileItem) => (record.isFolder ? '-' : formatFileSize(size)),
      width: 100,
      responsive: ['md'] as const,
    },
    {
      title: '修改时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
      width: 120,
      responsive: ['lg'] as const,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: FileItem) => (
        <Space size={0}>
          {!record.isFolder && (
            <Tooltip title="预览">
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => onPreview?.(record)}
              />
            </Tooltip>
          )}
          {!record.isFolder && (
            <Tooltip title="下载">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => onDownload?.(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="分享">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              size="small"
              onClick={() => onShare?.(record)}
            />
          </Tooltip>
          <Tooltip title="重命名">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => onRename?.(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteConfirm(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 140,
      align: 'center' as const,
      fixed: 'right' as const,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={files}
      rowKey="id"
      loading={loading}
      pagination={
        pagination && pagination.total > 0
          ? {
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 项 / 共 ${total} 项`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => onPageChange?.(page, pageSize),
              onShowSizeChange: (_, size) => onPageChange?.(1, size),
            }
          : false
      }
      scroll={{ x: 600 }}
      size="small"
      className="file-list-table"
    />
  );
};

export default FileList;
