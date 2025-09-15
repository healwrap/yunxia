import { Button, DatePicker, Form, Input, Modal, Switch, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { message } from '@/lib/staticMethodsStore';

import { ShareListItem, updateShare } from '../../lib/api/share';
import dayjs from '../../lib/dayjs';

const { Text } = Typography;

export interface EditShareModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  shareData: ShareListItem | null;
}

export const EditShareModal: React.FC<EditShareModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  shareData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [enablePassword, setEnablePassword] = useState(false);
  const [enableExpiry, setEnableExpiry] = useState(false);

  useEffect(() => {
    if (visible && shareData) {
      // 初始化表单和开关状态
      setEnablePassword(shareData.hasPassword);
      setEnableExpiry(!!shareData.expiredAt);

      const formValues: { expiredAt?: dayjs.Dayjs } = {};
      if (shareData.expiredAt) {
        formValues.expiredAt = dayjs(shareData.expiredAt);
      }

      form.setFieldsValue(formValues);
    } else if (!visible) {
      // 清理状态
      form.resetFields();
      setEnablePassword(false);
      setEnableExpiry(false);
    }
  }, [visible, shareData, form]);

  interface FormValues {
    password?: string;
    expiredAt?: dayjs.Dayjs;
  }

  const handleSubmit = async (values: FormValues) => {
    if (!shareData) return;

    setLoading(true);
    try {
      const params: { password?: string; expiredAt?: string } = {};

      if (enablePassword && values.password) {
        params.password = values.password;
      } else if (!enablePassword) {
        params.password = undefined; // 清除密码
      }

      if (enableExpiry && values.expiredAt) {
        params.expiredAt = values.expiredAt.toISOString();
      } else if (!enableExpiry) {
        params.expiredAt = undefined; // 清除过期时间
      }

      await updateShare(shareData.id, params);
      message.success('分享更新成功！');
      onSuccess?.();
      onCancel();
    } catch {
      message.error('更新分享失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="编辑分享设置" open={visible} onCancel={onCancel} footer={null} width={520}>
      {shareData && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <Text strong>文件名：</Text>
            <Text>{shareData.fileName}</Text>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text>设置访问密码</Text>
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

            <div className="flex justify-end space-x-2 mt-6">
              <Button onClick={onCancel}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                更新分享
              </Button>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
};
