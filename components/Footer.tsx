import React from 'react';
const FacebookIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="bg-orange-100 dark:bg-stone-900 border-t border-orange-200 dark:border-stone-800 mt-12">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 text-center text-orange-800 dark:text-stone-400">
        <p className="font-semibold">&copy; {new Date().getFullYear()} SukemNovel</p>
        <p className="text-sm mt-1 text-orange-700 dark:text-stone-500">
            Nơi cho bạn đắm chìm vào những bộ tiểu thuyết và truyện chữ hoàn toàn miễn phí.
        </p>
        <div className="flex justify-center items-center gap-6 mt-6">
            <a
                href="https://www.facebook.com/profile.php?id=61571330433241"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 dark:text-stone-400 hover:text-orange-800 dark:hover:text-amber-200 transition-colors transform hover:scale-110"
                aria-label="Facebook SukemNovel"
            >
                <FacebookIcon />
            </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
