import { CloudUploadOutlined } from '@ant-design/icons';
import { Badge, Button, Progress, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';

import { useUploadStore } from '../../store/uploadStore';
import UploadProgressPanel from './UploadProgressPanel';

/**
 * 头部上传状态按钮，显示上传进度和打开上传进度面板
 */
const UploadStatusButton: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const { tasks } = useUploadStore();

  // 计算上传任务统计信息
  useEffect(() => {
    if (tasks.length === 0) {
      setActiveCount(0);
      setTotalProgress(0);
      return;
    }

    // 计算活跃任务数量
    const active = tasks.filter(
      task => task.status === 'uploading' || task.status === 'waiting'
    ).length;
    setActiveCount(active);

    // 计算总体进度百分比
    if (active > 0) {
      const progressSum = tasks
        .filter(task => task.status !== 'success')
        .reduce((sum, task) => sum + task.progress, 0);

      const activeTaskCount = tasks.filter(task => task.status !== 'success').length;

      const avgProgress = activeTaskCount > 0 ? progressSum / activeTaskCount : 100;

      setTotalProgress(Math.round(avgProgress));
    } else if (tasks.length > 0) {
      // 如果没有活跃任务但有完成的任务，设置进度为100%
      setTotalProgress(100);
    }
  }, [tasks]);

  // 切换上传进度面板显示
  const togglePanel = () => {
    setVisible(!visible);
  };

  return (
    <>
      {activeCount > 0 ? (
        <Badge count={activeCount}>
          <Tooltip title={`正在上传: ${totalProgress}%`} placement="bottom">
            <Button
              type="text"
              shape="circle"
              className="upload-status-button relative"
              onClick={togglePanel}
            >
              <Progress type="circle" size={20} percent={totalProgress} showInfo={false} />
            </Button>
          </Tooltip>
        </Badge>
      ) : (
        <Badge dot={tasks.length > 0}>
          <Button type="text" shape="circle" icon={<CloudUploadOutlined />} onClick={togglePanel} />
        </Badge>
      )}

      <UploadProgressPanel visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};

export default UploadStatusButton;
