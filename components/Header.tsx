import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HeartIcon, 
  MagnifyingGlassIcon, 
  UserCircleIcon, 
  ArrowLeftEndOnRectangleIcon 
} from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 50) {
          setIsHeaderVisible(true);
          setIsScrolled(false);
      } else {
          setIsScrolled(true);
          if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY.current) {
            setIsHeaderVisible(true);
          }
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSearch.trim()) return;
    navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`);
    setIsMenuOpen(false);
  };

  const getDesktopLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin'));
    // Tăng px-4 để các link cách xa nhau hơn
    return `relative px-4 py-2 text-sm font-medium transition-colors duration-200 group
      ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400'}`;
  };

  const DesktopNavLinks = () => (
    <>
      <Link to="/" className={getDesktopLinkClass('/')}>
        Trang Chủ
        <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4"></span>
      </Link>
      {currentUser?.role === 'admin' && (
        <Link to="/admin" className={getDesktopLinkClass('/admin')}>
          Quản Trị
          <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4"></span>
        </Link>
      )}
      <Link to="/donate" className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ml-4">
        <HeartIcon className="h-4 w-4" />
        Ủng hộ
      </Link>
    </>
  );

  const MobileNavLinks = () => (
    <>
      <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors">Trang Chủ</Link>
      {currentUser?.role === 'admin' && (
        <Link to="/admin" className="block px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors">Quản Trị</Link>
      )}
      <Link to="/donate" className="flex items-center gap-2 px-4 py-3 rounded-lg text-rose-600 bg-rose-50 dark:bg-rose-900/20 font-medium mt-2">
        <HeartIcon className="h-5 w-5" /> Ủng hộ Admin
      </Link>
    </>
  );

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b
        ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
        ${isScrolled 
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg border-slate-200/50 dark:border-slate-700/50' 
          : 'bg-transparent border-transparent'}
      `}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-rose-500 to-amber-500"></div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20"> {/* Cố định chiều cao h-20 */}
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group relative z-10">
             <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg blur opacity-20 group-hover:opacity-60 transition duration-200"></div>
                <div className="relative h-11 w-11 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md transform group-hover:scale-105 transition-transform">
                    S
                </div>
             </div>
            <span className="text-2xl font-bold font-serif bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
              Sukem<span className="text-orange-600">Novel</span>
            </span>
          </Link>

          {/* Desktop Navigation Section - Tăng khoảng cách gap-8 */}
          <div className="hidden md:flex items-center gap-8">
            
            <form onSubmit={handleSearch} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-300 to-amber-300 rounded-full blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center">
                    <input
                        type="text"
                        placeholder="Tìm truyện..."
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        className="w-56 lg:w-72 py-2 pl-10 pr-4 text-sm border border-slate-200 dark:border-slate-700 rounded-full bg-white/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-sm"
                    />
                    <MagnifyingGlassIcon className="absolute left-3.5 h-4 w-4 text-slate-400"/>
                </div>
            </form>

            <nav className="flex items-center gap-2">
               <DesktopNavLinks />
            </nav>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-4 pl-2">
                   <Link to="/profile" className="flex items-center gap-3 group">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:ring-2 ring-orange-300 transition-all">
                          {currentUser.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">{currentUser.username}</span>
                   </Link>
                   <button onClick={logout} title="Đăng xuất" className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors">
                      <ArrowLeftEndOnRectangleIcon className="h-5 w-5"/>
                   </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors px-2">Đăng nhập</Link>
                  <Link to="/register" className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    Đăng Ký
                  </Link>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-3">
             <ThemeToggle />
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
               {isMenuOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
             </button>
          </div>
        </div>
      </div>

      <div className={`md:hidden absolute top-full left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
         <div className="p-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    placeholder="Tìm kiếm truyện..."
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="w-full py-3 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"/>
            </form>

            <nav className="space-y-1">
               <MobileNavLinks />
            </nav>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              {currentUser ? (
                <div className="space-y-3">
                   <div className="flex items-center gap-3 px-4">
                      <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">{currentUser.username.charAt(0)}</div>
                      <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{currentUser.username}</p>
                          <p className="text-xs text-slate-500">Thành viên</p>
                      </div>
                   </div>
                   <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                       <UserCircleIcon className="h-5 w-5 text-slate-500"/> Hồ sơ cá nhân
                   </Link>
                   <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                       <ArrowLeftEndOnRectangleIcon className="h-5 w-5"/> Đăng xuất
                   </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                   <Link to="/login" className="flex justify-center py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Đăng nhập</Link>
                   <Link to="/register" className="flex justify-center py-2.5 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700">Đăng ký</Link>
                </div>
              )}
            </div>
         </div>
      </div>
    </header>
  );
};

export default Header;
