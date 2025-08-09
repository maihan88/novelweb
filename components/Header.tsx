import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Bars3Icon, XMarkIcon, HeartIcon, ArrowRightEndOnRectangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
   const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  
  // Đóng menu mobile mỗi khi chuyển trang
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

    const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSearch.trim()) return;
    navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`)};
  
  // Hàm tạo class cho link, đã được bạn tối ưu
  const getLinkClass = (path: string, isMobile: boolean = false) => {
    const isActive = location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin'));
    const baseMobile = `block py-3 text-lg text-center w-full rounded-md transition-colors`;
    const baseDesktop = `px-3 py-2 text-sm font-medium rounded-md transition-colors`;
    
    if (isMobile) {
      return `${baseMobile} ${isActive ? 'bg-orange-200 dark:bg-stone-700 font-semibold text-orange-900 dark:text-amber-100' : 'hover:bg-yellow-50 dark:hover:bg-stone-700'}`;
    }
    return `${baseDesktop} ${isActive ? 'font-semibold text-orange-900 dark:text-amber-200' : 'hover:bg-stone-300/70 dark:hover:bg-stone-700'}`;
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
    <header className="bg-orange-200 dark:bg-stone-900 sticky top-0 z-40 w-full border-b border-stone-300 dark:border-stone-800">
      <div className="container mx-auto px-4 sm:px-6 md:px-8"></div>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold font-serif text-amber-900 dark:text-amber-100">
            SukemNovel
          </Link>
          
   {/* Desktop Navigation - ĐÃ DI CHUYỂN SANG PHẢI */}
          <div className="hidden md:flex items-center gap-2">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="w-40 lg:w-64 py-1.5 px-4 border border-amber-700 dark:border-stone-600 rounded-full bg-amber-50 dark:bg-stone-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-sm"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Tìm kiếm">
                    <MagnifyingGlassIcon className="h-4 w-4 text-stone-600"/>
                </button>
            </form>
            <nav className="flex items-center gap-1 text-stone-800 dark:text-stone-200">
                <Link to="/" className={getLinkClass('/')}>Trang Chủ</Link>
                {currentUser?.role === 'admin' && (
                    <Link to="/admin" className={getLinkClass('/admin')}>Quản Trị</Link>
                )}
                <Link to="/donate" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/50 hover:bg-red-100 dark:hover:bg-red-900 transition-colors">
                    <HeartIcon className="h-4 w-4" />
                    Ủng hộ
                </Link>
            </nav>
            <div className="w-px h-6 bg-amber-300 dark:bg-stone-700 mx-2"></div>
            {currentUser ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-orange-500 text-sm">
                  {currentUser.username}
                </Link>
                <button onClick={logout} className="text-sm font-medium">Đăng xuất</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className={getLinkClass('/login')}>Đăng Nhập</Link>
                <Link to="/register" className="px-4 py-1.5 text-sm font-semibold text-orange-600 border border-orange-600 rounded-full hover:bg-orange-50 dark:text-orange-400 dark:border-orange-400 dark:hover:bg-orange-900/50 transition-colors">
                  Đăng Ký
                </Link>
              </div>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center text-amber-900 dark:text-amber-100">
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="ml-2 p-2" aria-label="Mở menu">
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Panel */}
      {isMenuOpen && (
         <nav className="md:hidden absolute top-full left-0 w-full bg-orange-100 dark:bg-stone-800 shadow-lg p-4 space-y-2 border-t border-amber-200 dark:border-stone-800">
            <form onSubmit={handleSearch} className="relative mb-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm truyện..."
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="w-full py-3 px-4 border border-amber-300 dark:border-stone-700 rounded-lg bg-amber-50 dark:bg-stone-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-base"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Tìm kiếm">
                    <MagnifyingGlassIcon className="h-5 w-5 text-stone-400"/>
                </button>
            </form>
            <NavLinks isMobile={true}/>
            <div className="border-t border-amber-200 dark:border-stone-700 !my-3"></div>
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
