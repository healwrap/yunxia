import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export default function ClerkCallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">处理登录中...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
