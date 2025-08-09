import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon, HomeIcon, HeartIcon } from '@heroicons/react/24/solid';

const qrCodeImage = '/qr-code.png'; 

const DonatePage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto text-center py-12 px-4 animate-fade-in">
      
      <HeartIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
      
      <h1 className="text-4xl font-bold font-serif text-slate-900 dark:text-white mb-4">
        Ủng hộ
      </h1>
      <p className="text-slate-600 dark:text-amber-100 mb-8 max-w-lg mx-auto">
        Sự ủng hộ của bạn, dù lớn hay nhỏ, đều là nguồn động lực lớn lao để chúng tôi tiếp tục duy trì và phát triển trang web.
      </p>

      <div className="bg-white dark:bg-stone-500 p-6 sm:p-8 rounded-2xl shadow-xl inline-block border border-slate-200 dark:border-slate-700">
        <img 
          src={qrCodeImage} 
          alt="Mã QR thanh toán" 
          className="w-64 h-64 mx-auto rounded-lg border-4 border-slate-200 dark:border-slate-700 object-cover"
        />
        <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
          Quét mã để chuyển khoản
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          (Ngân hàng, Momo, ZaloPay, ...)
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
        <a 
          href={qrCodeImage} 
          download="sukem-novel-qr-donate.png"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-orange-400 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow"
        >
          <ArrowDownTrayIcon className="h-5 w-5"/>
          <span>Tải về mã QR</span>
        </a>
        <button 
          disabled 
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-200 dark:bg-stone-500 text-slate-500 dark:text-amber-100 font-semibold rounded-lg cursor-not-allowed"
        >
          Thanh toán Online (Sắp ra mắt)
        </button>
      </div>

      <div className="mt-16">
        <Link to="/" className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 hover:underline font-medium">
          <HomeIcon className="h-5 w-5" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    </div>
  );
};

export default DonatePage;