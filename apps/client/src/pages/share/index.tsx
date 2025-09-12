import { CopyOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import {
  Button,
  Divider,
  message,
  Modal,
  Pagination,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';

import { EditShareModal } from '../../components/Share/EditShareModal';
import { deleteShare, generateShareUrl, getShareList, ShareListItem } from '../../lib/api/share';
import dayjs from '../../lib/dayjs';

const { Text } = Typography;
const { confirm } = Modal;

export default function SharePage() {
  const [shares, setShares] = useState<ShareListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<'active' | 'expired' | 'all'>('active');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentShare, setCurrentShare] = useState<ShareListItem | null>(null);

  const loadShares = async () => {
    try {
      setLoading(true);
      const response = await getShareList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        status: statusFilter,
      });
      setShares(response.data.shares);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch {
      message.error('加载分享列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageSize, statusFilter]);

  const handleCopyLink = async (shareId: string) => {
    const shareUrl = generateShareUrl(shareId);
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success('链接已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const handleDeleteShare = (id: string, fileName: string) => {
    confirm({
      title: '确认取消分享',
      content: `确定要取消分享文件"${fileName}"吗？取消后分享链接将失效。`,
      onOk: async () => {
        try {
          await deleteShare(id);
          message.success('分享已取消');
          loadShares();
        } catch {
          message.error('取消分享失败');
        }
      },
    });
  };

  const handleEditShare = (share: ShareListItem) => {
    setCurrentShare(share);
    setEditModalVisible(true);
  };

  const handleViewShare = (shareId: string) => {
    const shareUrl = generateShareUrl(shareId);
    window.open(shareUrl, '_blank');
  };

  const columns: ColumnsType<ShareListItem> = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text strong>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      responsive: ['sm'] as const,
      render: (status: 'active' | 'expired') => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '有效' : '已过期'}
        </Tag>
      ),
    },
    {
      title: '访问',
      dataIndex: 'accessCount',
      key: 'accessCount',
      width: 70,
      align: 'center',
      responsive: ['md'] as const,
    },
    {
      title: '密码',
      dataIndex: 'hasPassword',
      key: 'hasPassword',
      width: 70,
      align: 'center',
      responsive: ['lg'] as const,
      render: (hasPassword: boolean) => (
        <Tag color={hasPassword ? 'orange' : 'default'}>{hasPassword ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expiredAt',
      key: 'expiredAt',
      width: 130,
      responsive: ['md'] as const,
      render: (expiredAt: string | null) =>
        expiredAt ? dayjs(expiredAt).format('MM-DD HH:mm') : '永不过期',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      responsive: ['lg'] as const,
      render: (createdAt: string) => dayjs(createdAt).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="复制链接">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyLink(record.shareId)}
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewShare(record.shareId)}
            />
          </Tooltip>
          <Tooltip title="编辑分享">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditShare(record)}
            />
          </Tooltip>
          <Tooltip title="取消分享">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteShare(record.id, record.fileName)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <Space>
          <Button
            type={statusFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('all')}
          >
            全部
          </Button>
          <Button
            type={statusFilter === 'active' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('active')}
          >
            有效
          </Button>
          <Button
            type={statusFilter === 'expired' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('expired')}
          >
            已过期
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={shares}
        loading={loading}
        rowKey="id"
        pagination={false}
        scroll={{ x: 800 }}
        size="small"
        className="responsive-table"
      />

      <Divider />

      <div className="flex justify-center">
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) => `${range[0]}-${range[1]} 共 ${total} 条`}
          onChange={(page, size) => {
            setPagination(prev => ({
              ...prev,
              current: page,
              pageSize: size || prev.pageSize,
            }));
          }}
        />
      </div>

      {/* 编辑分享模态框 */}
      <EditShareModal
        visible={editModalVisible}
        shareData={currentShare}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentShare(null);
        }}
        onSuccess={() => {
          loadShares();
        }}
      />
    </div>
  );
}
