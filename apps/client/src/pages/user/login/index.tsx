import { SignIn } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';

export default function UserLogin() {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <SignIn
          path="/user/login"
          routing="path"
          signUpUrl="/user/register"
          redirectUrl={redirectPath}
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-sm normal-case',
              card: 'rounded-xl shadow-md',
              headerTitle: 'text-xl font-bold text-gray-800',
              headerSubtitle: 'text-gray-500',
            },
          }}
        />
      </div>
    </div>
  );
}
