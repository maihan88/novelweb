import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon, HomeIcon, HeartIcon } from '@heroicons/react/24/solid';

const qrCodeImage = '/qr-code.png';

const DonatePage: React.FC = () => {
  // --- CẢI TIẾN GIAO DIỆN ---
  return (
    <div className="max-w-xl mx-auto text-center py-12 sm:py-16 px-4 animate-fade-in">

      <HeartIcon className="h-14 w-14 sm:h-16 sm:w-16 text-red-500 mx-auto mb-5 animate-pulse" /> {/* Icon lớn hơn và có hiệu ứng nhẹ */}

      <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 dark:text-white mb-4">
        Ủng hộ Dự án
      </h1>
      <p className="text-slate-600 dark:text-slate-300 mb-8 sm:mb-10 max-w-lg mx-auto leading-relaxed"> {/* Thêm leading-relaxed */}
        SukemNovel là dự án miễn phí. Sự ủng hộ của bạn, dù nhỏ, là nguồn động lực lớn để chúng tôi duy trì và phát triển trang web tốt hơn. Xin chân thành cảm ơn!
      </p>

      {/* Khối QR Code */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl inline-block border border-slate-200 dark:border-slate-700">
        <img
          src={qrCodeImage}
          alt="Mã QR thanh toán VietQR"
          className="w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-lg border-4 border-slate-100 dark:border-slate-600 object-cover shadow-md" // Kích thước và style ảnh
        />
        <p className="mt-5 font-semibold text-slate-800 dark:text-slate-200 text-lg">
          Quét mã VietQR
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          (Hỗ trợ hầu hết ứng dụng ngân hàng & ví điện tử)
        </p>
      </div>

      {/* Nút bấm */}
      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
        <a
          href={qrCodeImage}
          download="sukem-novel-qr-donate.png"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-slate-900" // Style nút tải
        >
          <ArrowDownTrayIcon className="h-5 w-5"/>
          <span>Tải về mã QR</span>
        </a>
        {/* Nút thanh toán online (vẫn disabled) */}
        <button
          disabled
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold rounded-lg cursor-not-allowed opacity-70"
        >
          Thanh toán Online (Sắp ra mắt)
        </button>
      </div>

      {/* Link về trang chủ */}
      <div className="mt-16 border-t border-slate-200 dark:border-slate-700 pt-6">
        <Link to="/" className="inline-flex items-center justify-center gap-1.5 text-sm text-orange-600 dark:text-amber-400 hover:underline font-medium group">
          <HomeIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    </div>
  );
};

export default DonatePage;
