import { Spin } from 'antd';

export const RouteLoading = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px] w-full">
      <Spin size="large" tip="加载中..." />
    </div>
  );
};
