
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Bars3Icon, XMarkIcon, UserCircleIcon, ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const getLinkClass = (path: string, isMobile: boolean = false) => {
    const isActive = location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin'));
    const baseClasses = 'transition-colors duration-200';
    const activeClasses = 'text-cyan-500 font-bold';
    const inactiveClasses = 'hover:text-cyan-500 dark:hover:text-cyan-400';

    if (isMobile) {
      return `block py-3 text-lg text-center w-full rounded-md ${baseClasses} ${isActive ? 'bg-cyan-50 dark:bg-slate-800 ' + activeClasses : inactiveClasses}`;
    }
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean}) => (
    <>
      <Link to="/" className={getLinkClass('/', isMobile)}>Trang Chủ</Link>
      {currentUser?.role === 'admin' && (
        <Link to="/admin" className={getLinkClass('/admin', isMobile)}>Quản Trị</Link>
      )}
    </>
  );

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Truyện Chữ
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4 md:space-x-6 text-sm font-medium">
            <NavLinks />
            {currentUser ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                  <UserCircleIcon className="h-5 w-5" />
                  <span>{currentUser.username}</span>
                </Link>
                <button onClick={logout} className="flex items-center gap-2 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                  <ArrowRightEndOnRectangleIcon className="h-5 w-5" />
                   <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={getLinkClass('/login')}>Đăng Nhập</Link>
                <Link to="/register" className="px-4 py-1.5 text-sm font-semibold text-cyan-600 border border-cyan-600 rounded-full hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-400 dark:hover:bg-cyan-900/50 transition-colors">
                  Đăng Ký
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>

          <div className="md:hidden flex items-center">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="ml-2 p-2 rounded-md text-slate-700 dark:text-slate-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 shadow-xl border-t border-slate-200 dark:border-slate-700">
           <nav className="flex flex-col items-center space-y-2 p-4">
            <NavLinks isMobile={true}/>
             <div className="w-full border-t border-slate-200 dark:border-slate-700 my-2" />
             {currentUser ? (
              <>
                <Link to="/profile" className={getLinkClass('/profile', true)}>Hồ sơ</Link>
                <button onClick={logout} className="block py-3 text-lg text-center w-full rounded-md hover:text-cyan-500">Đăng xuất</button>
              </>
            ) : (
              <>
                <Link to="/login" className={getLinkClass('/login', true)}>Đăng Nhập</Link>
                <Link to="/register" className={getLinkClass('/register', true)}>Đăng Ký</Link>
              </>
            )}
           </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
