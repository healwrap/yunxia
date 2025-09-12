import { CopyOutlined, LinkOutlined, LockOutlined } from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useState } from 'react';

import { createShare, CreateShareParams, generateShareUrl } from '../../lib/api/share';
import dayjs from '../../lib/dayjs';

const { Text } = Typography;

export interface ShareModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  fileId: string;
  fileName: string;
}

interface FormValues {
  password?: string;
  expiredAt?: dayjs.Dayjs;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  fileId,
  fileName,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [shareInfo, setShareInfo] = useState<{
    shareId: string;
    shareUrl: string;
    password?: string;
  } | null>(null);
  const [enablePassword, setEnablePassword] = useState(false);
  const [enableExpiry, setEnableExpiry] = useState(false);

  const handleCreateShare = async (values: FormValues) => {
    setLoading(true);
    try {
      // 创建新分享
      const params: CreateShareParams = { fileId };

      if (enablePassword && values.password) {
        params.password = values.password;
      }

      if (enableExpiry && values.expiredAt) {
        params.expiredAt = values.expiredAt.toISOString();
      }

      const result = await createShare(params);
      const shareUrl = generateShareUrl(result.data.shareId);

      setShareInfo({
        shareId: result.data.shareId,
        shareUrl,
        password: result.data.password || undefined,
      });

      message.success('分享创建成功！');
      onSuccess?.();
    } catch {
      message.error('创建分享失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareInfo) return;

    try {
      let textToCopy = shareInfo.shareUrl;
      if (shareInfo.password) {
        textToCopy += `\n提取密码：${shareInfo.password}`;
      }

      await navigator.clipboard.writeText(textToCopy);
      message.success('链接已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  const handleClose = () => {
    form.resetFields();
    setShareInfo(null);
    setEnablePassword(false);
    setEnableExpiry(false);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined />
          分享文件
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={520}
    >
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <Text strong>文件名：</Text>
          <Text>{fileName}</Text>
        </div>

        {!shareInfo ? (
          <Form form={form} layout="vertical" onFinish={handleCreateShare}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <LockOutlined />
                  <Text>设置访问密码</Text>
                </div>
                <Switch checked={enablePassword} onChange={setEnablePassword} size="small" />
              </div>

              {enablePassword && (
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入访问密码' },
                    { min: 4, message: '密码至少4位' },
                  ]}
                >
                  <Input.Password placeholder="请输入访问密码（4-20位）" maxLength={20} />
                </Form.Item>
              )}

              <div className="flex items-center justify-between">
                <Text>设置有效期</Text>
                <Switch checked={enableExpiry} onChange={setEnableExpiry} size="small" />
              </div>

              {enableExpiry && (
                <Form.Item name="expiredAt" rules={[{ required: true, message: '请选择过期时间' }]}>
                  <DatePicker
                    showTime
                    placeholder="选择过期时间"
                    disabledDate={current => current && current < dayjs().startOf('day')}
                    className="w-full"
                  />
                </Form.Item>
              )}
            </div>

            <Divider />

            <div className="flex justify-end space-x-2">
              <Button onClick={handleClose}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建分享
              </Button>
            </div>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div>
                <Text strong className="text-blue-700">
                  分享链接：
                </Text>
                <div className="mt-1 p-2 bg-white rounded border text-sm break-all">
                  {shareInfo.shareUrl}
                </div>
              </div>

              {shareInfo.password && (
                <div>
                  <Text strong className="text-blue-700">
                    提取密码：
                  </Text>
                  <div className="mt-1 p-2 bg-white rounded border text-sm">
                    {shareInfo.password}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button onClick={handleClose}>关闭</Button>
              <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyLink}>
                复制链接
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
