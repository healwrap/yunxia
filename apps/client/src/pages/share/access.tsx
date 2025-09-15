import { DownloadOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Row, Space, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { message } from '@/lib/staticMethodsStore';

import { downloadShareFile, getShare, type ShareDetail } from '../../lib/api/share';
import dayjs from '../../lib/dayjs';
import { formatFileSize } from '../../utils/format';

const { Title, Text, Paragraph } = Typography;

export default function ShareAccessPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareData, setShareData] = useState<ShareDetail | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [form] = Form.useForm();

  // 从URL参数中获取密码
  const urlPassword = searchParams.get('password');

  useEffect(() => {
    if (shareId) {
      fetchShareData(urlPassword || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId, urlPassword]);

  const fetchShareData = async (password?: string) => {
    if (!shareId) return;

    try {
      setLoading(true);
      const data = await getShare(shareId, password);
      setShareData(data.data);
      setPasswordRequired(false);
    } catch (error) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        setPasswordRequired(true);
        setShareData(null);
        if (password) {
          message.error('密码错误，请重新输入');
        }
      } else if (err.response?.status === 404) {
        message.error('分享不存在或已失效');
      } else if (err.response?.status === 410) {
        message.error('分享已过期');
      } else {
        message.error('获取分享内容失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (values: { password: string }) => {
    fetchShareData(values.password);
  };

  const handleDownload = async () => {
    if (!shareId || !shareData || !shareData.file) return;

    try {
      setDownloading(true);
      const password = form.getFieldValue('password') || urlPassword;

      // 获取临时下载链接
      const downloadUrl = await downloadShareFile(shareId, password || undefined);

      // 在新标签页中打开下载链接
      window.open(downloadUrl, '_blank');

      message.success('下载链接已打开，请在新标签页中查看下载状态');
    } catch (error) {
      const err = error as { response?: { status: number } };
      let errorMessage = '下载失败，请稍后重试';

      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = '密码错误';
      } else if (err.response?.status === 404) {
        errorMessage = '文件不存在';
      } else if (err.response?.status === 410) {
        errorMessage = '分享已过期';
      }

      message.error(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <LockOutlined className="text-4xl text-blue-500 mb-4" />
            <Title level={3}>需要访问密码</Title>
            <Text type="secondary">此分享已设置访问密码，请输入密码后查看</Text>
          </div>

          <Form form={form} onFinish={handlePasswordSubmit} layout="vertical">
            <Form.Item
              name="password"
              label="访问密码"
              rules={[{ required: true, message: '请输入访问密码' }]}
            >
              <Input.Password placeholder="请输入访问密码" autoComplete="off" />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button type="primary" htmlType="submit" loading={loading} className="w-full">
                访问分享
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  if (!shareData || !shareData.file) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <Title level={3}>分享不存在</Title>
          <Text type="secondary">您访问的分享链接不存在或已失效</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-4xl mx-auto">
        <Card>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={16}>
              <div className="mb-6">
                <Title level={2} className="mb-2">
                  {shareData?.file?.name || '未知文件'}
                </Title>
                <Space>
                  <Text type="secondary">
                    文件大小：{formatFileSize(shareData?.file?.size || 0)}
                  </Text>
                  <Text type="secondary">文件类型：{shareData?.file?.type || '未知'}</Text>
                </Space>
              </div>

              <div className="mb-6">
                <Paragraph>
                  这是一个分享文件，您可以预览或下载该文件。如需获取更多文件，请联系分享者。
                </Paragraph>
              </div>

              <Space size="large">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  size="large"
                  loading={downloading}
                  onClick={handleDownload}
                >
                  下载文件
                </Button>

                {!shareData?.file?.isFolder && (
                  <Button icon={<EyeOutlined />} size="large">
                    预览文件
                  </Button>
                )}
              </Space>
            </Col>

            <Col xs={24} md={8}>
              <Card size="small" className="bg-gray-50">
                <Title level={4}>分享信息</Title>
                <div className="space-y-2">
                  <div>
                    <Text strong>创建时间：</Text>
                    <br />
                    <Text>{dayjs(shareData.share.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </div>

                  {shareData.share.expiredAt && (
                    <div>
                      <Text strong>过期时间：</Text>
                      <br />
                      <Text>{dayjs(shareData.share.expiredAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                    </div>
                  )}

                  <div>
                    <Text strong>访问限制：</Text>
                    <br />
                    <Text>{shareData.share.hasPassword ? '需要密码' : '无限制'}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
}
