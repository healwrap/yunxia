import { ClerkProvider } from '@clerk/clerk-react';
import { RouterProvider } from 'react-router-dom';

import routes from '@/routes/index.tsx';

export default function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <RouterProvider router={routes} />
    </ClerkProvider>
  );
}
