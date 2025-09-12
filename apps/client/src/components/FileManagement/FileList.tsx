import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileOutlined,
  FolderOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Button, Space, Table, Tooltip, Typography } from 'antd';
import React from 'react';

import { formatFileSize } from '../../utils/format';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  extension?: string;
  createdAt: string;
  updatedAt: string;
  isFolder: boolean;
  parentId?: string;
}

interface FileListProps {
  files: FileItem[];
  loading?: boolean;
  onPreview?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onShare?: (file: FileItem) => void;
  onFolderClick?: (folder: FileItem) => void;
}

/**
 * 文件列表组件，展示文件列表和提供操作按钮
 */
const FileList: React.FC<FileListProps> = ({
  files,
  loading = false,
  onPreview,
  onDownload,
  onDelete,
  onShare,
  onFolderClick,
}) => {
  // 获取文件图标
  const getFileIcon = (file: FileItem) => {
    if (file.isFolder) return <FolderOutlined className="text-blue-500" />;

    return <FileOutlined className="text-gray-500" />;
  };

  const columns = [
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
      width: 120,
    },
    {
      title: '修改时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: FileItem) => (
        <Space size="small">
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
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => onDelete?.(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 160,
      align: 'center' as const,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={files}
      rowKey="id"
      loading={loading}
      pagination={false}
      className="file-list-table"
    />
  );
};

export default FileList;
