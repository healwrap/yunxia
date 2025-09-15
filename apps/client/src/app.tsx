import { ClerkProvider } from '@clerk/clerk-react';
import { App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';

import { StaticMethodsInitializer } from '@/lib/staticMethods';
import routes from '@/routes/index.tsx';

export default function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <AntdApp>
        <StaticMethodsInitializer />
        <RouterProvider router={routes} />
      </AntdApp>
    </ClerkProvider>
  );
}
