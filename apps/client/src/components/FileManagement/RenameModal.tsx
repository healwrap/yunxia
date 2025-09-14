import { Form, Input, Modal } from 'antd';
import { useEffect, useState } from 'react';

import { fileApi } from '@/lib/api/file';
import { message } from '@/lib/staticMethodsStore';

import { FileItem } from './FileList';

interface RenameModalProps {
  visible: boolean;
  file: FileItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * 重命名文件/文件夹模态框
 */
const RenameModal: React.FC<RenameModalProps> = ({ visible, file, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && file) {
      form.setFieldsValue({ name: file.name });
    }
  }, [visible, file, form]);

  const handleOk = async () => {
    if (!file) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      await fileApi.renameFile(file.id, {
        name: values.name,
      });

      message.success('重命名成功');
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || '重命名失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={`重命名${file?.isFolder ? '文件夹' : '文件'}`}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            { max: 255, message: '名称不能超过255个字符' },
            {
              pattern: /^[^<>:"/\\|?*]+$/,
              message: '名称不能包含以下字符：< > : " / \\ | ? *',
            },
          ]}
        >
          <Input placeholder="请输入新名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RenameModal;
