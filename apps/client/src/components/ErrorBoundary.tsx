import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">页面未找到</h1>
          <p>抱歉，您访问的页面不存在。</p>
          <a href="/" className="text-blue-500 mt-4">
            返回首页
          </a>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">出错了</h1>
      <p>抱歉，发生了未知错误。</p>
      <a href="/" className="text-blue-500 mt-4">
        返回首页
      </a>
    </div>
  );
}
