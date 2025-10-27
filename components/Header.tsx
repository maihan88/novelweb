import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Bars3Icon, XMarkIcon, HeartIcon, MagnifyingGlassIcon, UserCircleIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/solid'; // Thêm UserCircleIcon, ArrowLeftEndOnRectangleIcon

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

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false); // State mới để theo dõi đã cuộn chưa
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // === CẬP NHẬT LOGIC ===
      // Luôn hiển thị khi ở trên cùng
      if (currentScrollY <= 50) {
          setIsHeaderVisible(true);
          setIsScrolled(false); // Chưa cuộn đủ xa
      } else {
          setIsScrolled(true); // Đã cuộn
          // Chỉ ẩn khi đang cuộn xuống VÀ đã cuộn qua một ngưỡng nhất định
          if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY.current) { // Hiển thị lại khi cuộn lên
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
    setIsMenuOpen(false); // Đóng menu sau khi tìm kiếm trên mobile
  };

  const getLinkClass = (path: string, isMobile: boolean = false) => {
    const isActive = location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin'));
    const baseMobile = `block py-3 px-4 text-base font-medium rounded-lg transition-colors duration-150`; // Điều chỉnh padding, font size
    const baseDesktop = `px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 hover:bg-orange-100/70 dark:hover:bg-stone-700/70`; // Điều chỉnh padding

    if (isMobile) {
      return `${baseMobile} ${isActive ? 'bg-orange-100 dark:bg-stone-700 text-orange-700 dark:text-amber-200' : 'text-slate-700 dark:text-stone-300 hover:bg-orange-50 dark:hover:bg-stone-700/50'}`;
    }
    // Cập nhật class desktop
    return `${baseDesktop} ${isActive ? 'text-orange-700 dark:text-amber-200 font-semibold' : 'text-slate-700 dark:text-stone-300'}`;
  };

  // Nút ủng hộ dùng chung class
  const donateClasses = (isMobile: boolean = false) => {
      const base = isMobile
        ? `block py-3 px-4 text-base font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-2`
        : `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150`;
      return `${base} text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 dark:focus:ring-offset-stone-900`;
  };

  const NavLinks: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => (
    <>
      <Link to="/" className={getLinkClass('/', isMobile)}>Trang Chủ</Link>
      {currentUser?.role === 'admin' && (
        <Link to="/admin" className={getLinkClass('/admin', isMobile)}>Quản Trị</Link>
      )}
      <Link to="/donate" className={donateClasses(isMobile)}>
        <HeartIcon className="h-4 w-4" />
        Ủng hộ
      </Link>
    </>
  );

  // === CẬP NHẬT HEADER CLASSES ===
  const headerClasses = `
    bg-orange-100/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-40 w-full
    border-b border-orange-200/50 dark:border-stone-800/50
    transition-all duration-300 ease-in-out
    ${isScrolled ? 'shadow-md' : 'shadow-none'}
    ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
  `;
  // === KẾT THÚC ===

  return (
      <header className={headerClasses}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8"> {/* Thêm responsive padding */}
        <div className="flex justify-between items-center h-16"> {/* Giữ chiều cao */}
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold font-serif text-orange-900 dark:text-amber-200 hover:opacity-80 transition-opacity">
            SukemNovel
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4"> {/* Tăng gap */}
             {/* Tìm kiếm trước */}
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    placeholder="Tìm truyện..."
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="w-48 lg:w-64 py-1.5 pl-9 pr-4 border border-orange-200 dark:border-stone-700 rounded-full bg-white/70 dark:bg-stone-800/70 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition text-sm placeholder-slate-400 dark:placeholder-stone-500 shadow-sm" // Style input
                />
                <button type="submit" className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1" aria-label="Tìm kiếm">
                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 dark:text-stone-500"/>
                </button>
            </form>
            {/* Nav links */}
            <nav className="flex items-center gap-1">
                <NavLinks />
            </nav>
            {/* Divider */}
            <div className="w-px h-6 bg-orange-200 dark:bg-stone-700"></div>
            {/* Auth section */}
            <div className="flex items-center gap-3"> {/* Tăng gap */}
              {currentUser ? (
                <>
                  <Link to="/profile" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-stone-200 hover:text-orange-600 dark:hover:text-amber-300 transition-colors">
                    <UserCircleIcon className="h-5 w-5"/>
                    <span>{currentUser.username}</span>
                  </Link>
                  <button onClick={logout} className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" aria-label="Đăng xuất">
                      <ArrowLeftEndOnRectangleIcon className="h-5 w-5"/>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={getLinkClass('/login')}>Đăng Nhập</Link>
                  <Link to="/register" className="px-3 py-1.5 text-sm font-semibold text-orange-600 border border-orange-500 rounded-full hover:bg-orange-50 dark:text-amber-300 dark:border-amber-400 dark:hover:bg-amber-900/30 transition-colors shadow-sm">
                    Đăng Ký
                  </Link>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2 text-orange-900 dark:text-amber-100"> {/* Tăng gap */}
            {/* Nút tìm kiếm mobile (nếu muốn) */}
             {/* <button className="p-2" aria-label="Tìm kiếm">
                 <MagnifyingGlassIcon className="h-5 w-5"/>
             </button> */}
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 -mr-2" aria-label="Mở menu"> {/* Bù trừ margin */}
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {/* Cải thiện giao diện mobile menu */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-orange-50 dark:bg-stone-800 shadow-lg border-t border-orange-200 dark:border-stone-700 transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-screen opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}>
         <nav className="px-4 space-y-3">
            <form onSubmit={handleSearch} className="relative mb-3">
                <input
                    type="text"
                    placeholder="Tìm kiếm truyện..."
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-4 border border-orange-200 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 focus:ring-2 focus:ring-orange-400 focus:border-transparent transition text-base shadow-sm"
                />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 p-1" aria-label="Tìm kiếm">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-stone-400"/>
                </button>
            </form>
            <NavLinks isMobile={true}/>
            <div className="border-t border-orange-200 dark:border-stone-700 !my-3"></div>
            {currentUser ? (
              <>
                <Link to="/profile" className={`${getLinkClass('/profile', true)} flex items-center justify-center gap-2`}>
                    <UserCircleIcon className="h-5 w-5"/> Hồ sơ
                </Link>
                <button onClick={logout} className={`${getLinkClass('', true)} text-red-600 dark:text-red-400 w-full flex items-center justify-center gap-2`}>
                    <ArrowLeftEndOnRectangleIcon className="h-5 w-5"/> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={getLinkClass('/login', true)}>Đăng Nhập</Link>
                <Link to="/register" className={getLinkClass('/register', true)}>Đăng Ký</Link>
              </>
            )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
