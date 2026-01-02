import React from 'react';
import { Link } from 'react-router-dom';

const FacebookIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-24 bg-slate-900 text-slate-300 pt-20 pb-8 overflow-hidden">
      
      {/* --- WAVE SVG EFFECT --- */}
      <div className="absolute top-0 left-0 right-0 -mt-1 w-full overflow-hidden leading-[0]">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] sm:h-[60px] md:h-[100px]">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                className="fill-slate-50 dark:fill-slate-900 transition-colors duration-300"></path> 
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Responsive Grid: Text center on mobile, left on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 border-b border-slate-800 pb-12 text-center md:text-left">
          
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="col-span-1 md:col-span-2 space-y-4 flex flex-col items-center md:items-start">
            <Link to="/" className="text-3xl font-bold font-serif text-white inline-block">
              Sukem<span className="text-orange-500">Novel</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
              Nơi đắm chìm vào thế giới tiên hiệp, huyền huyễn. Đọc truyện miễn phí, cập nhật nhanh nhất với giao diện chuẩn User Experience.
            </p>
            <div className="flex gap-4 pt-2 justify-center md:justify-start">
                <a
                    href="https://www.facebook.com/profile.php?id=61571330433241"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-blue-500/50"
                    aria-label="Facebook"
                >
                    <FacebookIcon />
                </a>
            </div>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div className="col-span-1">
             <h3 className="text-white font-semibold mb-4 text-lg">Khám phá</h3>
             <ul className="space-y-3 text-sm">
                <li><Link to="/search" className="hover:text-orange-400 hover:pl-2 transition-all duration-200 block md:inline-block">Tìm kiếm truyện</Link></li>
                <li><Link to="/search?sort=views" className="hover:text-orange-400 hover:pl-2 transition-all duration-200 block md:inline-block">Bảng xếp hạng</Link></li>
                <li><Link to="/donate" className="hover:text-orange-400 hover:pl-2 transition-all duration-200 block md:inline-block">Ủng hộ tác giả</Link></li>
             </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div className="col-span-1">
             <h3 className="text-white font-semibold mb-4 text-lg">Thông tin</h3>
             <ul className="space-y-3 text-sm">
                <li><span className="text-slate-500">Phiên bản:</span> 1.0.0 Beta</li>
                <li><span className="text-slate-500">Liên hệ:</span> sukemnovel@gmail.com</li>
                <li><Link to="/privacy" className="hover:text-orange-400 transition-colors block md:inline-block">Chính sách bảo mật</Link></li>
             </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4 text-center md:text-left">
           <p>&copy; {new Date().getFullYear()} SukemNovel. All rights reserved.</p>
           <p className="flex items-center gap-1 justify-center">
                Designed with <span className="text-red-500 animate-pulse">❤</span> for readers
           </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
