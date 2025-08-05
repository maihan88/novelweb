import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Bars3Icon, XMarkIcon, HeartIcon, ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Đóng menu mobile mỗi khi chuyển trang
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Hàm tạo class cho link, đã được bạn tối ưu
  const getLinkClass = (path: string, isMobile: boolean = false) => {
    const isActive = location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin'));
    const baseMobile = `block py-3 text-lg text-center w-full rounded-md transition-colors`;
    const baseDesktop = `px-3 py-2 text-sm font-medium rounded-md transition-colors`;
    
    if (isMobile) {
      return `${baseMobile} ${isActive ? 'bg-slate-100 dark:bg-slate-700 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`;
    }
    return `${baseDesktop} ${isActive ? 'font-semibold text-cyan-600 dark:text-cyan-400' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`;
  };

  // Component NavLinks đã được bạn tối ưu
  const NavLinks: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => (
    <>
      <Link to="/" className={getLinkClass('/', isMobile)}>Trang Chủ</Link>
      {currentUser?.role === 'admin' && (
        <Link to="/admin" className={getLinkClass('/admin', isMobile)}>Quản Trị</Link>
      )}
      <Link to="/donate" className={
        isMobile 
        ? `${getLinkClass('/donate', isMobile)} text-red-600 dark:text-red-400`
        : "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
      }>
        <HeartIcon className="h-4 w-4 inline-block mr-1" />
        Ủng hộ
      </Link>
    </>
  );

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Truyện Chữ
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 text-slate-700 dark:text-slate-300">
            <NavLinks />
          </nav>
          
          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="font-semibold text-slate-700 dark:text-slate-200 hover:text-cyan-500">
                  {currentUser.username}
                </Link>
                <button onClick={logout} className={getLinkClass('')}>Đăng xuất</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className={getLinkClass('/login')}>Đăng Nhập</Link>
                <Link to="/register" className="px-4 py-1.5 text-sm font-semibold text-cyan-600 border border-cyan-600 rounded-full hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-400 dark:hover:bg-cyan-900/50 transition-colors">
                  Đăng Ký
                </Link>
              </div>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="ml-2 p-2" aria-label="Mở menu">
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <nav className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-800 shadow-lg p-4 space-y-2 border-t border-slate-200 dark:border-slate-700">
            <NavLinks isMobile={true}/>
            <div className="border-t border-slate-200 dark:border-slate-700 !my-3"></div>
            {currentUser ? (
              <>
                <Link to="/profile" className={getLinkClass('/profile', true)}>Hồ sơ của bạn</Link>
                <button onClick={logout} className={`${getLinkClass('', true)} text-red-500 w-full`}>Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login" className={getLinkClass('/login', true)}>Đăng Nhập</Link>
                <Link to="/register" className={getLinkClass('/register', true)}>Đăng Ký</Link>
              </>
            )}
        </nav>
      )}
    </header>
  );
};

export default Header;