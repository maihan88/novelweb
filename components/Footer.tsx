import React from 'react';
import { Link } from 'react-router-dom';

const FacebookIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
);

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    // Compact Footer
    <footer className="relative mt-12 bg-sukem-card text-sukem-text-muted pt-12 pb-6 overflow-hidden transition-colors duration-300 border-t-0">
      
      {/* --- WAVE SVG EFFECT (COMPACT VERSION) --- */}
      <div className="absolute top-0 left-0 right-0 -mt-1 w-full overflow-hidden leading-[0] z-0">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] sm:h-[60px] md:h-[100px]">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                className="fill-sukem-bg transition-colors duration-300"></path> 
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center space-y-3 max-w-4xl mx-auto">
          
          {/* Logo compact */}
          <Link to="/" className="group inline-block mt-2">
             <h2 className="text-2xl md:text-3xl font-bold font-serif bg-gradient-to-r from-sukem-primary to-sukem-accent bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              SukemNovel
            </h2>
          </Link>

          {/* Slogan: Text nhỏ */}
          <p className="text-sukem-text-muted text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto px-4">
            Nơi đắm chìm vào thế giới truyện lãng mạn, huyền huyễn
          </p>

          {/* Nút nhỏ gọn */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a 
              href="https://www.facebook.com/profile.php?id=61571330433241" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-5 py-1.5 rounded-full bg-sukem-bg hover:bg-blue-50 border border-sukem-border hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <span className="text-sukem-text-muted group-hover:text-blue-600 transition-colors">
                <FacebookIcon />
              </span>
              <span className="text-xs font-bold text-sukem-text group-hover:text-blue-700">Fanpage</span>
            </a>

            <a 
              href="mailto:contact@sukemnovel.com" 
              className="group flex items-center gap-2 px-5 py-1.5 rounded-full bg-sukem-bg hover:bg-amber-50 border border-sukem-border hover:border-amber-200 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-sukem-text-muted group-hover:text-amber-600 transition-colors">
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
              <span className="text-xs font-bold text-sukem-text group-hover:text-amber-700">Liên hệ</span>
            </a>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="mt-6 pt-4 border-t border-sukem-border/50 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] sm:text-xs text-sukem-text-muted/80">
          <p>
            &copy; {currentYear} SukemNovel. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-sukem-primary transition-colors">Điều khoản</Link>
            <Link to="/privacy" className="hover:text-sukem-primary transition-colors">Bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;