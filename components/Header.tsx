import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bars3Icon, XMarkIcon, HeartIcon, MagnifyingGlassIcon, 
  UserCircleIcon, ArrowLeftEndOnRectangleIcon, FunnelIcon
} from '@heroicons/react/24/solid';

// ĐỊNH NGHĨA CÁC KHOẢNG CHƯƠNG (CHECKLIST)
const CHAPTER_RANGES = [
    { value: 'all', label: 'Tất cả' },
    { value: '0-50', label: '< 50 chương' },
    { value: '50-100', label: '50 - 100 chương' },
    { value: '100-200', label: '100 - 200 chương' },
    { value: '200-500', label: '200 - 500 chương' },
    { value: '500-1000', label: '500 - 1000 chương' },
    { value: '1000-max', label: '> 1000 chương' }
];

const Header: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedRange, setSelectedRange] = useState<string>('all');

  useEffect(() => {
      setIsMenuOpen(false);
      if (!location.pathname.includes('/search')) {
        setIsFilterOpen(false);
      }
      
      const q = searchParams.get('q') || '';
      const status = searchParams.get('status') || 'all';
      const range = searchParams.get('chapterRange') || 'all';

      setLocalSearch(q);
      setStatusFilter(status);
      setSelectedRange(range);
  }, [location.pathname, searchParams]);

  // --- SỬA LỖI Ở ĐÂY ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Logic mới: Nếu Menu Mobile đang mở (isMenuOpen === true)
      // thì KHÔNG chạy logic đóng popup, để tránh xung đột với nút bấm trên mobile.
      if (isMenuOpen) return;

      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterRef, isMenuOpen]); // Thêm isMenuOpen vào dependency
  // ---------------------

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const params = new URLSearchParams();
    if (localSearch.trim()) params.append('q', localSearch.trim());
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (selectedRange !== 'all') params.append('chapterRange', selectedRange);

    navigate(`/search?${params.toString()}`);
    setIsFilterOpen(false); 
    setIsMenuOpen(false);
  };

  const FilterPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
      <div className={`${
        isMobile 
            ? 'relative w-full mt-2 shadow-none border-t border-sukem-border pt-4' 
            : 'absolute top-full right-0 mt-3 w-80 shadow-2xl border border-sukem-border rounded-xl'
        } bg-sukem-card z-50 p-5 animate-fade-in-down transition-all`}>
          
          <div className="space-y-5">
              {/* Lọc Trạng thái */}
              <div>
                  <label className="text-xs font-bold text-sukem-text-muted uppercase mb-2 block tracking-wider">Trạng thái</label>
                  <div className="flex gap-2">
                      {[
                          { value: 'all', label: 'Tất cả' },
                          { value: 'ongoing', label: 'Đang ra' },
                          { value: 'completed', label: 'Hoàn thành' }
                      ].map(opt => (
                          <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStatusFilter(opt.value)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                                  statusFilter === opt.value
                                      ? 'bg-sukem-primary text-white border-sukem-primary shadow-sm'
                                      : 'bg-sukem-bg text-sukem-text border-sukem-border hover:border-sukem-primary'
                              }`}
                          >
                              {opt.label}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Lọc Số chương */}
              <div>
                  <label className="text-xs font-bold text-sukem-text-muted uppercase mb-2 block tracking-wider">Số lượng chương</label>
                  <div className="grid grid-cols-2 gap-2">
                      {CHAPTER_RANGES.map((range) => (
                          <button
                              key={range.value}
                              type="button"
                              onClick={() => setSelectedRange(range.value)}
                              className={`px-2 py-2 text-xs text-left rounded-lg border transition-all truncate ${
                                  selectedRange === range.value
                                      ? 'bg-sukem-accent text-white border-sukem-accent font-semibold'
                                      : 'bg-sukem-bg text-sukem-text border-sukem-border hover:border-sukem-accent'
                              }`}
                          >
                             {range.label}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-sukem-border flex justify-end gap-3">
                  <button 
                      type="button"
                      onClick={() => {
                          setStatusFilter('all');
                          setSelectedRange('all');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-sukem-text-muted hover:text-sukem-text transition-colors"
                  >
                      Đặt lại
                  </button>
                  <button 
                      type="button"
                      onClick={(e) => handleSearch(e)}
                      className="px-5 py-1.5 text-xs font-bold text-white bg-sukem-primary rounded-lg hover:bg-opacity-90 transition-all shadow-md active:scale-95"
                  >
                      Áp dụng
                  </button>
              </div>
          </div>
      </div>
  );
  
  const getDesktopLinkClass = (path: string) => { const isActive = location.pathname === path || (path === '/admin' && location.pathname.startsWith('/admin')); return `relative px-4 py-2 text-sm font-medium transition-colors duration-200 group ${isActive ? 'text-sukem-accent' : 'text-sukem-text hover:text-sukem-accent'}`; };
  const DesktopNavLinks = () => ( <> <Link to="/" className={getDesktopLinkClass('/')}> Trang Chủ <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-sukem-primary transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4"></span> </Link> {currentUser?.role === 'admin' && ( <Link to="/admin" className={getDesktopLinkClass('/admin')}> Quản Trị <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-sukem-primary transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4"></span> </Link> )} <Link to="/donate" className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full bg-sukem-primary text-white hover:shadow-lg hover:bg-opacity-90 hover:-translate-y-0.5 transition-all duration-200 ml-4"> <HeartIcon className="h-4 w-4" /> Ủng hộ </Link> </> );
  const MobileNavLinks = () => ( <> <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-sukem-bg text-sukem-text font-medium transition-colors">Trang Chủ</Link> {currentUser?.role === 'admin' && ( <Link to="/admin" className="block px-4 py-3 rounded-lg hover:bg-sukem-bg text-sukem-text font-medium transition-colors">Quản Trị</Link> )} <Link to="/donate" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sukem-primary bg-sukem-bg font-medium mt-2"> <HeartIcon className="h-5 w-5" /> Ủng hộ </Link> </> );

  return (
    <header className="relative w-full z-40 bg-sukem-card border-b border-sukem-border shadow-sm transition-colors duration-300">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sukem-primary via-sukem-accent to-sukem-primary"></div>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 group relative z-10">
             <img src="/logo_header_light.png" alt="SukemNovel Logo" className="h-26 w-auto object-contain"/>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-8">
            <div className="relative group" ref={filterRef}>
                <form onSubmit={handleSearch} className="relative flex items-center">
                    <input type="text" placeholder="Tìm truyện..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} className="w-56 lg:w-72 py-2 pl-10 pr-10 text-sm border border-sukem-border rounded-full bg-sukem-bg text-sukem-text focus:ring-2 focus:ring-sukem-accent focus:border-transparent transition-all shadow-sm placeholder-sukem-text-muted/70" />
                    <MagnifyingGlassIcon className="absolute left-3.5 h-4 w-4 text-sukem-text-muted"/>
                    <button type="button" onClick={() => setIsFilterOpen(!isFilterOpen)} className={`absolute right-1.5 p-1.5 rounded-full transition-colors ${isFilterOpen ? 'bg-sukem-primary text-white' : 'text-sukem-text-muted hover:text-sukem-primary hover:bg-sukem-border'}`} title="Bộ lọc nâng cao">
                        <FunnelIcon className="h-4 w-4" />
                    </button>
                </form>
                {/* Desktop: Absolute */}
                {isFilterOpen && <FilterPanel />}
            </div>
            <nav className="flex items-center gap-2"><DesktopNavLinks /></nav>
            <div className="w-px h-8 bg-sukem-border"></div>
            <div className="flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-4 pl-2">
                   <Link to="/profile" className="flex items-center gap-3 group">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sukem-primary to-sukem-accent flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:ring-2 ring-sukem-secondary transition-all">{currentUser.username.charAt(0).toUpperCase()}</div>
                      <span className="text-sm font-semibold text-sukem-text max-w-[120px] truncate">{currentUser.username}</span>
                   </Link>
                   <button onClick={logout} title="Đăng xuất" className="p-2 rounded-full hover:bg-sukem-bg text-sukem-text-muted hover:text-red-500 transition-colors"><ArrowLeftEndOnRectangleIcon className="h-5 w-5"/></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-sukem-text hover:text-sukem-accent transition-colors px-2">Đăng nhập</Link>
                  <Link to="/register" className="px-5 py-2 text-sm font-semibold text-white bg-sukem-text rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all">Đăng Ký</Link>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-3">
             <ThemeToggle />
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-sukem-text hover:bg-sukem-bg rounded-lg transition-colors">{isMenuOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}</button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-sukem-card border-b border-sukem-border shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-[85vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'}`}>
         <div className="p-4 space-y-4">
            <div className="space-y-2 border-b border-sukem-border pb-4">
                <form onSubmit={handleSearch} className="relative">
                    <input type="text" placeholder="Tìm kiếm truyện..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} className="w-full py-3 pl-11 pr-4 bg-sukem-bg border border-sukem-border rounded-xl focus:ring-2 focus:ring-sukem-accent outline-none text-sukem-text transition-all placeholder-sukem-text-muted/70" />
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sukem-text-muted"/>
                </form>
                
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)} 
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${isFilterOpen ? 'bg-sukem-primary text-white border-sukem-primary' : 'bg-sukem-bg border-sukem-border text-sukem-text hover:bg-sukem-border'}`}
                >
                    <FunnelIcon className="h-5 w-5" /> {isFilterOpen ? 'Đóng bộ lọc' : 'Mở bộ lọc nâng cao'}
                </button>

                {/* Mobile: Relative (Embedded) */}
                {isFilterOpen && (
                   <FilterPanel isMobile={true} />
                )}
            </div>
            
            <nav className="space-y-1"><MobileNavLinks /></nav>
            
            <div className="border-t border-sukem-border pt-4">
              {currentUser ? (
                <div className="space-y-3">
                   <div className="flex items-center gap-3 px-4">
                      <div className="h-10 w-10 rounded-full bg-sukem-primary flex items-center justify-center text-white font-bold">{currentUser.username.charAt(0)}</div>
                      <div><p className="font-semibold text-sukem-text">{currentUser.username}</p><p className="text-xs text-sukem-text-muted">Thành viên</p></div>
                   </div>
                   <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sukem-bg transition-colors text-sukem-text"><UserCircleIcon className="h-5 w-5 text-sukem-text-muted"/> Hồ sơ cá nhân</Link>
                   <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-sukem-bg transition-colors"><ArrowLeftEndOnRectangleIcon className="h-5 w-5"/> Đăng xuất</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3"><Link to="/login" className="flex justify-center py-2.5 rounded-lg border border-sukem-border font-medium text-sukem-text hover:bg-sukem-bg">Đăng nhập</Link><Link to="/register" className="flex justify-center py-2.5 rounded-lg bg-sukem-primary text-white font-medium hover:bg-opacity-90">Đăng ký</Link></div>
              )}
            </div>
         </div>
      </div>
    </header>
  );
};

export default Header;