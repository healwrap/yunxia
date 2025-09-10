// import { Image } from 'antd';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
// import GradualBlurMemo from "./GradualBlur";

interface NavItem {
  label: string;
  href: string;
}

export default function Navbar({
  // logoUrl,
  items,
}: {
  logoUrl: string;
  items: NavItem[];
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="w-full fixed top-0 left-0 right-0 z-50">
      {/* <GradualBlurMemo
				className="!fixed top-0 z-0"
				target="parent"
				position="top"
				height="6rem"
				strength={2}
				divCount={5}
				curve="bezier"
				exponential={true}
				opacity={1}
			/> */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          {/* <Image src={logoUrl} alt="Logo" width={32} height={32} preview={false} /> */}
          <span className="ml-2 text-white font-bold text-xl">YunXia</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {items.map(item => (
            <Link
              key={item.label}
              to={item.href}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {/* GitHub Link */}
          <a
            href="https://github.com/healwrap/yunxia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300 transition-colors flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            GitHub
          </a>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <Link to="/user/login">
                <button className="text-white hover:text-gray-300 cursor-pointer">登录</button>
              </Link>
              <Link to="/user/register">
                <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                  注册
                </button>
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-8 h-8',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white cursor-pointer" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/80 backdrop-blur-lg z-10">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {items.map(item => (
              <Link
                key={item.label}
                to={item.href}
                className="text-white hover:text-gray-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* GitHub Link - Mobile */}
            <a
              href="https://github.com/healwrap/yunxia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub
            </a>

            {/* Auth Buttons */}
            <div className="flex flex-col space-y-4">
              <SignedOut>
                <Link to="/user/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="text-white hover:text-gray-300 block w-full text-left cursor-pointer">
                    登录
                  </button>
                </Link>
                <Link to="/user/register" onClick={() => setIsMenuOpen(false)}>
                  <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full text-left cursor-pointer">
                    注册
                  </button>
                </Link>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center mt-2">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: 'w-8 h-8',
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
