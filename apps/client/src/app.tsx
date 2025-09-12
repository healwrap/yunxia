import { ClerkProvider } from '@clerk/clerk-react';
import { RouterProvider } from 'react-router-dom';

import TokenInitializer from '@/components/TokenInitializer';
import routes from '@/routes/index.tsx';

export default function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      {/* TokenInitializer负责在应用启动时获取并设置身份验证令牌 */}
      <TokenInitializer />
      <RouterProvider router={routes} />
    </ClerkProvider>
  );
}
