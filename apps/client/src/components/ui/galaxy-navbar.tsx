'use client';

import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavItem {
  key?: string;
  label: string | React.ReactNode;
  href: string;
  children?: NavItem[];
  external?: boolean;
}

interface GalaxyNavbarProps {
  logo?: React.ReactNode;
  items?: NavItem[];
  ctaText?: string;
  onCtaClick?: () => void;
  secondaryCtaText?: string;
  onSecondaryCtaClick?: () => void;
}

export function GalaxyNavbar({
  logo,
  items = [],
  ctaText = 'Get Started',
  onCtaClick,
  secondaryCtaText = 'Sign In',
  onSecondaryCtaClick,
}: GalaxyNavbarProps) {
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileDropdowns, setMobileDropdowns] = useState<Record<string, boolean>>({});

  const handleMouseEnterNavItem = (item: string) => setHoveredNavItem(item);
  const handleMouseLeaveNavItem = () => setHoveredNavItem(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isMobileMenuOpen) {
      setMobileDropdowns({});
    }
  };

  const toggleMobileDropdown = (key: string) => {
    setMobileDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navLinkClass = (itemName: string, extraClasses = '') => {
    const isCurrentItemHovered = hoveredNavItem === itemName;
    const isAnotherItemHovered = hoveredNavItem !== null && !isCurrentItemHovered;

    const colorClass = isCurrentItemHovered
      ? 'text-white'
      : isAnotherItemHovered
        ? 'text-gray-500'
        : 'text-gray-300';

    return `text-sm transition duration-150 ${colorClass} ${extraClasses}`;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        setMobileDropdowns({});
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

  const defaultLogo = (
    <div className="text-white" style={{ width: '32px', height: '32px' }}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32ZM12.4306 9.70695C12.742 9.33317 13.2633 9.30058 13.6052 9.62118L19.1798 14.8165C19.4894 15.1054 19.4894 15.5841 19.1798 15.873L13.6052 21.0683C13.2633 21.3889 12.742 21.3563 12.4306 19.9991V9.70695Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-20"
      style={{
        backgroundColor: 'rgba(13, 13, 24, 0.3)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '0 0 15px 15px',
      }}
    >
      <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-6 lg:space-x-8">
          {logo || defaultLogo}

          <div className="hidden lg:flex items-center space-x-6 text-white">
            {items.map((item, index) => {
              const itemKey =
                item.key || (typeof item.label === 'string' ? item.label : `item-${index}`);
              return (
                <div
                  key={index}
                  className="relative group"
                  onMouseEnter={() => handleMouseEnterNavItem(itemKey)}
                  onMouseLeave={handleMouseLeaveNavItem}
                >
                  <a
                    href={item.href}
                    className={navLinkClass(itemKey, 'flex items-center')}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown className="ml-1 w-3 h-3 group-hover:rotate-180 transition-transform duration-200" />
                    )}
                  </a>
                  {item.children && (
                    <div
                      className="absolute left-0 mt-2 w-48 bg-black bg-opacity-50 rounded-md shadow-lg py-2 border border-gray-700/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30"
                      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                    >
                      {item.children.map((child, childIndex) => (
                        <a
                          key={childIndex}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          {secondaryCtaText && (
            <button
              onClick={onSecondaryCtaClick}
              className="hidden sm:block text-gray-300 hover:text-white text-sm"
            >
              {secondaryCtaText}
            </button>
          )}
          <button
            onClick={onCtaClick}
            className="bg-[#8200DB29] hover:bg-black/50 text-white font-semibold py-2 px-5 rounded-full text-sm md:text-base border border-[#322D36]"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {ctaText}
          </button>
          <button
            className="lg:hidden text-white p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden bg-black bg-opacity-50 border-t border-gray-700/30 absolute top-full left-0 right-0 z-30
           overflow-hidden transition-all duration-300 ease-in-out
           ${isMobileMenuOpen ? 'max-h-screen opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'}`}
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <div className="px-4 py-6 flex flex-col space-y-4">
          {items.map((item, index) => {
            const itemKey =
              item.key || (typeof item.label === 'string' ? item.label : `item-${index}`);
            return (
              <div key={index} className="relative text-white">
                {item.children ? (
                  <>
                    <button
                      className="text-gray-300 hover:text-gray-100 flex items-center justify-between w-full text-left text-sm py-2"
                      onClick={() => toggleMobileDropdown(itemKey)}
                      aria-expanded={mobileDropdowns[itemKey]}
                    >
                      {item.label}
                      <ChevronDown
                        className={`ml-2 w-3 h-3 transition-transform duration-200 ${mobileDropdowns[itemKey] ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <div
                      className={`pl-4 space-y-2 mt-2 overflow-hidden transition-all duration-300 ease-in-out  ${
                        mobileDropdowns[itemKey]
                          ? 'max-h-[200px] opacity-100 pointer-events-auto'
                          : 'max-h-0 opacity-0 pointer-events-none'
                      }`}
                    >
                      {item.children.map((child, childIndex) => (
                        <a
                          key={childIndex}
                          href={child.href}
                          className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition duration-150"
                          onClick={toggleMobileMenu}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <a
                    href={item.href}
                    className="text-gray-300 hover:text-gray-100 text-sm py-2 transition duration-150"
                    onClick={toggleMobileMenu}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                  >
                    {item.label}
                  </a>
                )}
              </div>
            );
          })}
          {secondaryCtaText && (
            <button
              onClick={onSecondaryCtaClick}
              className="text-gray-300 hover:text-gray-100 text-sm py-2 transition duration-150"
            >
              {secondaryCtaText}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
