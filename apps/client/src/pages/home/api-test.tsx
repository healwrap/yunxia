import { Button, Card, Space, Typography } from 'antd';
import { useState } from 'react';

import request from '@/lib/request';

const { Title, Text } = Typography;

interface ApiResponse {
  message?: string;
  userId?: string;
  sessionId?: string;
  session?: Record<string, unknown>;
}

export default function ApiTest() {
  const [publicResponse, setPublicResponse] = useState<string | null>(null);
  const [protectedResponse, setProtectedResponse] = useState<ApiResponse | null>(null);
  const [userResponse, setUserResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState({
    public: false,
    protected: false,
    user: false,
  });

  // 测试公开 API
  const testPublicApi = async () => {
    setLoading(prev => ({ ...prev, public: true }));
    try {
      const response = await request.get('/');
      setPublicResponse(response.data);
    } finally {
      setLoading(prev => ({ ...prev, public: false }));
    }
  };

  // 测试受保护的 API
  const testProtectedApi = async () => {
    setLoading(prev => ({ ...prev, protected: true }));
    try {
      const response = await request.get<ApiResponse>('/protected');
      setProtectedResponse(response.data);
    } finally {
      setLoading(prev => ({ ...prev, protected: false }));
    }
  };

  // 获取用户信息
  const getUserInfo = async () => {
    setLoading(prev => ({ ...prev, user: true }));
    try {
      const response = await request.get<ApiResponse>('/me');
      setUserResponse(response.data);
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  };

  return (
    <div className="p-8">
      <Title level={2}>API 测试</Title>
      <Text className="block mb-4">
        本组件用于测试与后端 API 的通信，包括公开和需要鉴权的接口。
      </Text>

      <Space direction="vertical" size="large" className="w-full">
        <Card title="公开 API 测试" bordered>
          <Button type="primary" onClick={testPublicApi} loading={loading.public}>
            测试公开 API
          </Button>
          {publicResponse && (
            <div className="mt-4">
              <Title level={5}>响应数据：</Title>
              <pre className="bg-gray-100 p-2 rounded">{publicResponse}</pre>
            </div>
          )}
        </Card>

        <Card title="受保护 API 测试" bordered>
          <Button type="primary" onClick={testProtectedApi} loading={loading.protected}>
            测试受保护 API
          </Button>
          {protectedResponse && (
            <div className="mt-4">
              <Title level={5}>响应数据：</Title>
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(protectedResponse, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        <Card title="获取用户信息" bordered>
          <Button type="primary" onClick={getUserInfo} loading={loading.user}>
            获取用户信息
          </Button>
          {userResponse && (
            <div className="mt-4">
              <Title level={5}>响应数据：</Title>
              <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(userResponse, null, 2)}</pre>
            </div>
          )}
        </Card>
      </Space>
    </div>
  );
}
