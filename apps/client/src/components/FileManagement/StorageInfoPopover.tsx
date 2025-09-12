import { CloudOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Popover, Progress, Space, Statistic, Typography } from 'antd';
import React, { useState } from 'react';

import { fileApi, StorageInfo } from '@/lib/api/file';
import { useAuthToken } from '@/lib/auth';
import { formatFileSize } from '@/utils/format';

const { Text } = Typography;

interface StorageInfoPopoverProps {
  children?: React.ReactNode;
}

/**
 * 存储空间信息弹出组件
 */
const StorageInfoPopover: React.FC<StorageInfoPopoverProps> = ({ children }) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { updateRequestToken } = useAuthToken();

  // 加载存储信息
  const loadStorageInfo = async () => {
    try {
      setLoading(true);
      await updateRequestToken();
      const response = await fileApi.getStorageInfo();
      setStorageInfo(response.data);
    } catch (error) {
      // 静默处理错误，避免控制台输出
      void error;
    } finally {
      setLoading(false);
    }
  };

  // 当 popover 打开时加载数据
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadStorageInfo();
    }
  };

  const content = (
    <div className="w-80 p-2">
      {loading || !storageInfo ? (
        <div className="h-24 flex items-center justify-center">
          <span>加载中...</span>
        </div>
      ) : (
        <Space direction="vertical" size="middle" className="w-full">
          <div className="flex items-center justify-between">
            <Text strong>
              <CloudOutlined className="mr-2" />
              存储空间
            </Text>
            <Text type="secondary">
              {formatFileSize(storageInfo.usedSpace)} / {formatFileSize(storageInfo.totalSpace)}
            </Text>
          </div>

          <Progress
            percent={storageInfo.usagePercentage}
            strokeColor={{
              '0%': '#108ee9',
              '50%': '#87d068',
              '80%': '#ff9c6e',
              '100%': '#ff4d4f',
            }}
            showInfo={false}
            size="small"
          />

          <div className="grid grid-cols-2 gap-4">
            <Statistic
              title="已用空间"
              value={formatFileSize(storageInfo.usedSpace)}
              prefix={<InboxOutlined />}
              valueStyle={{ fontSize: '14px' }}
            />
            <Statistic
              title="可用空间"
              value={formatFileSize(storageInfo.availableSpace)}
              prefix={<CloudOutlined />}
              valueStyle={{ fontSize: '14px' }}
            />
          </div>

          {storageInfo.fileTypeStats && storageInfo.fileTypeStats.length > 0 && (
            <div>
              <Text strong className="mb-2 block">
                文件类型统计
              </Text>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {storageInfo.fileTypeStats.map(stat => (
                  <div key={stat.type} className="flex items-center justify-between">
                    <Text type="secondary">{stat.type}</Text>
                    <Space>
                      <Text type="secondary">{stat.count} 个</Text>
                      <Text>{formatFileSize(stat.size)}</Text>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Space>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title="存储信息"
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
    >
      {children || (
        <Button
          type="primary"
          shape="circle"
          icon={<CloudOutlined />}
          className="hover:bg-gray-100"
        />
      )}
    </Popover>
  );
};

export default StorageInfoPopover;
