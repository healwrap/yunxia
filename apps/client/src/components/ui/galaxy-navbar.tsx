'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  const navbarRef = useRef<HTMLDivElement>(null);

  const handleMouseEnterNavItem = (item: string) => setHoveredNavItem(item);
  const handleMouseLeaveNavItem = () => setHoveredNavItem(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // 添加点击外部关闭菜单的效果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        navbarRef.current &&
        !navbarRef.current.contains(event.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // 平滑滚动到锚点
  const handleAnchorClick = (href: string, e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
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
        closeMobileMenu();
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
        <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" />
        <circle cx="16" cy="16" r="5" fill="white" />
      </svg>
    </div>
  );

  return (
    <nav
      ref={navbarRef}
      className="fixed top-0 left-0 right-0 w-full z-20"
      style={{
        borderRadius: '0 0 15px 15px',
      }}
    >
      <div
        className="w-full"
        style={{
          backgroundColor: 'rgba(13, 13, 24, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
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
                      onClick={e => !item.external && handleAnchorClick(item.href, e)}
                    >
                      {item.label}
                    </a>
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
      </div>

      {/* Mobile Menu - 和顶部菜单使用相同的高斯模糊背景 */}
      <div
        className={`lg:hidden border-t border-gray-700/30 absolute top-full left-0 right-0 z-30
           overflow-hidden transition-all duration-300 ease-in-out
           ${isMobileMenuOpen ? 'max-h-screen opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'}`}
        style={{
          backgroundColor: 'rgba(13, 13, 24, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="py-6 flex flex-col">
          {items.map((item, index) => {
            return (
              <a
                key={index}
                href={item.href}
                className="block w-full text-center py-4 px-6
                         text-gray-300 hover:text-white hover:bg-white/10 
                         active:bg-white/20 active:scale-95
                         transition-all duration-200 ease-in-out
                         "
                onClick={e => {
                  if (!item.external) {
                    handleAnchorClick(item.href, e);
                  }
                  closeMobileMenu();
                }}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
              >
                <span className="text-base font-medium">{item.label}</span>
              </a>
            );
          })}
          {secondaryCtaText && (
            <button
              onClick={() => {
                onSecondaryCtaClick?.();
                closeMobileMenu();
              }}
              className="w-full text-center py-4 px-6
                       text-gray-300 hover:text-white hover:bg-white/10 
                       active:bg-white/20 active:scale-95
                       transition-all duration-200 ease-in-out
                       "
            >
              <span className="text-lg font-medium">{secondaryCtaText}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
