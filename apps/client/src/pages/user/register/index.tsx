import { SignUp } from '@clerk/clerk-react';

export default function UserRegister() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <SignUp
          path="/user/register"
          routing="path"
          signInUrl="/user/login"
          afterSignUpUrl="/"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-sm normal-case',
              card: 'rounded-xl shadow-md',
              headerTitle: 'text-xl font-bold text-gray-800',
              headerSubtitle: 'text-gray-500',
            },
          }}
          redirectUrl="/"
        />
      </div>
    </div>
  );
}
