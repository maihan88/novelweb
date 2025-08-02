
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import ThemeToggle from './ThemeToggle.tsx';
import { UserIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const getLinkClass = (path: string, isMobile: boolean = false) => {
    const isActive = location.pathname === path;
    const baseClasses = 'transition-colors duration-200';
    const activeClasses = 'text-cyan-500 font-bold';
    const inactiveClasses = 'hover:text-cyan-500 dark:hover:text-cyan-400';

    if (isMobile) {
      return `block py-3 text-lg text-center w-full rounded-md ${baseClasses} ${isActive ? 'bg-cyan-50 dark:bg-slate-800 ' + activeClasses : inactiveClasses}`;
    }
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const NavLinks = ({ isMobile = false }: { isMobile?: boolean}) => (
    <>
      <Link to="/" className={getLinkClass('/', isMobile)}>
        Trang Chủ
      </Link>
      
      {currentUser ? (
        <>
          <Link to="/profile" className={getLinkClass('/profile', isMobile)}>
            Hồ sơ
          </Link>
          {currentUser.role === 'admin' && (
            <Link to="/admin" className={getLinkClass('/admin', isMobile)}>
              Quản Trị
            </Link>
          )}
          <button onClick={handleLogout} className={isMobile 
            ? 'flex items-center justify-center gap-2 py-3 text-lg w-full text-red-500'
            : 'flex items-center gap-1 hover:text-red-500 dark:hover:text-red-400 transition-colors'
          }>
             <ArrowRightOnRectangleIcon className="h-5 w-5" />
             <span>Đăng xuất</span>
          </button>
        </>
      ) : (
         <>
          <Link to="/login" className={`${getLinkClass('/login', isMobile)} flex items-center justify-center gap-1`}>
            <UserIcon className="h-5 w-5" />
            <span>Đăng nhập</span>
          </Link>
          <Link to="/register" className={isMobile
            ? 'block w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-md text-lg font-semibold hover:bg-indigo-700 transition-colors'
            : 'px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors'
          }>
            Đăng ký
          </Link>
         </>
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
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 md:space-x-6 text-sm font-medium">
            <NavLinks />
            <ThemeToggle />
          </nav>

          {/* Mobile Navigation Toggle */}
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
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 shadow-xl border-t border-slate-200 dark:border-slate-700">
           <nav className="flex flex-col items-center space-y-2 p-4">
            <NavLinks isMobile={true}/>
           </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
