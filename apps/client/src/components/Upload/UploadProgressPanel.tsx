import {
  CloseCircleOutlined,
  CloudDownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Button, Drawer, List, Progress, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import type { UploadTask } from '../../store/uploadStore';
import { useUploadStore } from '../../store/uploadStore';

interface UploadProgressPanelProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * 上传进度面板，显示所有上传任务的状态
 */
const UploadProgressPanel: React.FC<UploadProgressPanelProps> = ({ visible, onClose }) => {
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const { tasks, pauseTask, resumeTask, cancelTask, processQueue } = useUploadStore();

  // 统计活跃任务数量
  useEffect(() => {
    const activeTasks = tasks.filter(
      task => task.status === 'uploading' || task.status === 'waiting'
    ).length;
    setActiveTaskCount(activeTasks);
  }, [tasks]);

  // 渲染任务列表项
  const renderTaskItem = (task: UploadTask) => {
    // 状态标识的颜色
    const statusColor = {
      waiting: '#faad14',
      uploading: '#1890ff',
      paused: '#fa8c16',
      success: '#52c41a',
      error: '#f5222d',
    };

    // 状态对应的中文说明
    const statusText = {
      waiting: '等待中',
      uploading: '上传中',
      paused: '已暂停',
      success: '已完成',
      error: '失败',
    };

    return (
      <List.Item key={task.id}>
        <div className="w-full">
          <div className="flex justify-between">
            <Typography.Text
              ellipsis={{ tooltip: task.file.name }}
              className="max-w-[200px]"
              strong
            >
              {task.file.name}
            </Typography.Text>
            <Typography.Text
              type={task.status === 'error' ? 'danger' : undefined}
              style={{ color: task.status !== 'error' ? statusColor[task.status] : undefined }}
            >
              {statusText[task.status]}
            </Typography.Text>
          </div>

          <div className="mt-2">
            <Progress
              percent={task.progress}
              size="small"
              status={
                task.status === 'error'
                  ? 'exception'
                  : task.status === 'success'
                    ? 'success'
                    : task.status === 'paused'
                      ? 'normal'
                      : 'active'
              }
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <Typography.Text type="secondary" className="text-xs">
              {Math.round((task.file.size / 1024 / 1024) * 100) / 100} MB
            </Typography.Text>

            {/* 操作按钮 */}
            <Space>
              {/* 正在上传或等待中的任务可以暂停或取消 */}
              {(task.status === 'uploading' || task.status === 'waiting') && (
                <>
                  <Button
                    type="text"
                    icon={<PauseCircleOutlined />}
                    size="small"
                    onClick={() => pauseTask(task.id)}
                    disabled={task.status === 'waiting'}
                    title="暂停"
                  />
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    size="small"
                    danger
                    onClick={() => {
                      cancelTask(task.id).catch(() => {
                        // 静默处理取消任务失败的情况
                      });
                    }}
                    title="取消"
                  />
                </>
              )}

              {/* 已暂停的任务可以恢复或取消 */}
              {task.status === 'paused' && (
                <>
                  <Button
                    type="text"
                    icon={<PlayCircleOutlined />}
                    size="small"
                    onClick={() => {
                      resumeTask(task.id);
                      processQueue(); // 恢复后处理队列
                    }}
                    title="继续"
                  />
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    size="small"
                    danger
                    onClick={() => {
                      cancelTask(task.id).catch(() => {
                        // 静默处理取消任务失败的情况
                      });
                    }}
                    title="取消"
                  />
                </>
              )}

              {/* 失败的任务可以重试或删除 */}
              {task.status === 'error' && (
                <>
                  <Button
                    type="text"
                    icon={<PlayCircleOutlined />}
                    size="small"
                    onClick={() => {
                      // 重置状态为等待中并重新触发上传
                      resumeTask(task.id);
                      processQueue();
                    }}
                    title="重试"
                  />
                  <Button
                    type="text"
                    icon={<CloseCircleOutlined />}
                    size="small"
                    danger
                    onClick={() => {
                      cancelTask(task.id).catch(() => {
                        // 静默处理取消任务失败的情况
                      });
                    }}
                    title="删除"
                  />
                </>
              )}

              {/* 成功的任务可以删除 */}
              {task.status === 'success' && (
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  size="small"
                  onClick={() => {
                    cancelTask(task.id).catch(() => {
                      // 静默处理取消任务失败的情况
                    });
                  }}
                  title="删除"
                />
              )}
            </Space>
          </div>

          {task.error && (
            <Typography.Text type="danger" className="text-xs block mt-1">
              错误: {task.error.message}
            </Typography.Text>
          )}
        </div>
      </List.Item>
    );
  };

  return (
    <Drawer
      title={
        <div className="flex justify-between items-center">
          <span>
            文件上传
            {activeTaskCount > 0 && (
              <Typography.Text type="secondary" className="ml-2">
                ({activeTaskCount}个正在进行)
              </Typography.Text>
            )}
          </span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={320}
    >
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <CloudDownloadOutlined style={{ fontSize: 48 }} />
          <Typography.Text type="secondary" className="mt-3">
            暂无上传任务
          </Typography.Text>
        </div>
      ) : (
        <List
          dataSource={[...tasks].sort((a, b) => {
            // 优先按状态排序: 上传中 > 等待中 > 已暂停 > 已完成/失败
            const statusOrder = { uploading: 0, waiting: 1, paused: 2, error: 3, success: 4 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
              return statusOrder[a.status] - statusOrder[b.status];
            }
            // 其次按创建时间排序，新的在前
            return b.createdAt - a.createdAt;
          })}
          renderItem={renderTaskItem}
          className="upload-task-list"
        />
      )}
    </Drawer>
  );
};

export default UploadProgressPanel;
