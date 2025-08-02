import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-6 text-center text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} Truyện Chữ Của Tôi. All rights reserved.</p>
        <p className="text-sm mt-1">Được tạo ra với niềm đam mê dịch thuật.</p>
      </div>
    </footer>
  );
};

export default Footer;