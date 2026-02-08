import React, { useState, useEffect } from 'react';
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSearch.trim()) return;
    navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`);
    setIsMenuOpen(false);
  };

  const getDesktopLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin'));
    return `relative px-4 py-2 text-sm font-medium transition-colors duration-200 group
      ${isActive ? 'text-sukem-accent' : 'text-sukem-text hover:text-sukem-accent'}`;
  };

  const DesktopNavLinks = () => (
    <>
      <Link to="/" className={getDesktopLinkClass('/')}>
        Trang Chủ
        {/* Underline Animation using Primary Color */}
        <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-sukem-primary transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4"></span>
      </Link>
      {currentUser?.role === 'admin' && (
        <Link to="/admin" className={getDesktopLinkClass('/admin')}>
          Quản Trị
          <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-sukem-primary transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4"></span>
        </Link>
      )}
      <Link to="/donate" className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full bg-sukem-primary text-white hover:shadow-lg hover:bg-opacity-90 hover:-translate-y-0.5 transition-all duration-200 ml-4">
        <HeartIcon className="h-4 w-4" />
        Ủng hộ
      </Link>
    </>
  );

  const MobileNavLinks = () => (
    <>
      <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-sukem-bg text-sukem-text font-medium transition-colors">Trang Chủ</Link>
      {currentUser?.role === 'admin' && (
        <Link to="/admin" className="block px-4 py-3 rounded-lg hover:bg-sukem-bg text-sukem-text font-medium transition-colors">Quản Trị</Link>
      )}
      <Link to="/donate" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sukem-primary bg-sukem-bg font-medium mt-2">
        <HeartIcon className="h-5 w-5" /> Ủng hộ Admin
      </Link>
    </>
  );

  return (
    // Header Background: Card color (Vanilla/Mocha)
    <header className="relative w-full z-40 bg-sukem-card border-b border-sukem-border shadow-sm transition-colors duration-300">
      {/* Top Gradient Line: Primary -> Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sukem-primary via-sukem-accent to-sukem-primary"></div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group relative z-10">
             <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-sukem-primary to-sukem-accent rounded-lg blur opacity-20 group-hover:opacity-60 transition duration-200"></div>
                <div className="relative h-11 w-11 bg-sukem-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md transform group-hover:scale-105 transition-transform">
                    S
                </div>
             </div>
            <span className="text-2xl font-bold font-serif text-sukem-text">
              Sukem<span className="text-sukem-primary">Novel</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <form onSubmit={handleSearch} className="relative group">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        placeholder="Tìm truyện..."
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        // Input Background: Body color (Cream/Espresso) to contrast with Header (Card color)
                        className="w-56 lg:w-72 py-2 pl-10 pr-4 text-sm border border-sukem-border rounded-full bg-sukem-bg text-sukem-text focus:ring-2 focus:ring-sukem-accent focus:border-transparent transition-all shadow-sm placeholder-sukem-text-muted/70"
                    />
                    <MagnifyingGlassIcon className="absolute left-3.5 h-4 w-4 text-sukem-text-muted"/>
                </div>
            </form>

            <nav className="flex items-center gap-2">
               <DesktopNavLinks />
            </nav>

            <div className="w-px h-8 bg-sukem-border"></div>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-4 pl-2">
                   <Link to="/profile" className="flex items-center gap-3 group">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sukem-primary to-sukem-accent flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:ring-2 ring-sukem-secondary transition-all">
                          {currentUser.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-sukem-text max-w-[120px] truncate">{currentUser.username}</span>
                   </Link>
                   <button onClick={logout} title="Đăng xuất" className="p-2 rounded-full hover:bg-sukem-bg text-sukem-text-muted hover:text-red-500 transition-colors">
                      <ArrowLeftEndOnRectangleIcon className="h-5 w-5"/>
                   </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-sukem-text hover:text-sukem-accent transition-colors px-2">Đăng nhập</Link>
                  <Link to="/register" className="px-5 py-2 text-sm font-semibold text-white bg-sukem-text rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    Đăng Ký
                  </Link>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
             <ThemeToggle />
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-sukem-text hover:bg-sukem-bg rounded-lg transition-colors">
               {isMenuOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-sukem-card border-b border-sukem-border shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
         <div className="p-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    placeholder="Tìm kiếm truyện..."
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="w-full py-3 pl-11 pr-4 bg-sukem-bg border border-sukem-border rounded-xl focus:ring-2 focus:ring-sukem-accent outline-none text-sukem-text transition-all placeholder-sukem-text-muted/70"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sukem-text-muted"/>
            </form>

            <nav className="space-y-1">
               <MobileNavLinks />
            </nav>

            <div className="border-t border-sukem-border pt-4">
              {currentUser ? (
                <div className="space-y-3">
                   <div className="flex items-center gap-3 px-4">
                      <div className="h-10 w-10 rounded-full bg-sukem-primary flex items-center justify-center text-white font-bold">{currentUser.username.charAt(0)}</div>
                      <div>
                          <p className="font-semibold text-sukem-text">{currentUser.username}</p>
                          <p className="text-xs text-sukem-text-muted">Thành viên</p>
                      </div>
                   </div>
                   <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sukem-bg transition-colors text-sukem-text">
                       <UserCircleIcon className="h-5 w-5 text-sukem-text-muted"/> Hồ sơ cá nhân
                   </Link>
                   <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-sukem-bg transition-colors">
                       <ArrowLeftEndOnRectangleIcon className="h-5 w-5"/> Đăng xuất
                   </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                   <Link to="/login" className="flex justify-center py-2.5 rounded-lg border border-sukem-border font-medium text-sukem-text hover:bg-sukem-bg">Đăng nhập</Link>
                   <Link to="/register" className="flex justify-center py-2.5 rounded-lg bg-sukem-primary text-white font-medium hover:bg-opacity-90">Đăng ký</Link>
                </div>
              )}
            </div>
         </div>
      </div>
    </header>
  );
};

export default Header;