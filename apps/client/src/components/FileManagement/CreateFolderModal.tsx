import { Form, Input, Modal } from 'antd';
import React, { useState } from 'react';

import { fileApi } from '@/lib/api/file';
import { message } from '@/lib/staticMethodsStore';

interface CreateFolderModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  parentId?: string;
}

/**
 * 创建文件夹模态框
 */
const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  parentId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await fileApi.createFolder({
        name: values.name,
        parentId,
      });

      message.success('文件夹创建成功');
      form.resetFields();
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message || '创建文件夹失败');
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
      title="新建文件夹"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          label="文件夹名称"
          name="name"
          rules={[
            { required: true, message: '请输入文件夹名称' },
            { max: 255, message: '文件夹名称不能超过255个字符' },
            {
              pattern: /^[^<>:"/\\|?*]+$/,
              message: '文件夹名称不能包含以下字符：< > : " / \\ | ? *',
            },
          ]}
        >
          <Input placeholder="请输入文件夹名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateFolderModal;
