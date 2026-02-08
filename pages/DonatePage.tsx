import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon, HomeIcon, HeartIcon } from '@heroicons/react/24/solid';

const qrCodeImage = '/qr-code.png';

const DonatePage: React.FC = () => {
  return (
    // Sử dụng bg-sukem-bg cho nền tổng thể (đã set ở body nhưng thêm vào đây để chắc chắn fill vùng)
    <div className="max-w-xl mx-auto text-center py-12 sm:py-16 px-4 animate-fade-in text-sukem-text">

      {/* Icon trái tim dùng màu Primary (Hồng/Đỏ) */}
      <HeartIcon className="h-14 w-14 sm:h-16 sm:w-16 text-sukem-primary mx-auto mb-5 animate-pulse" />

      <h1 className="text-3xl sm:text-4xl font-bold font-serif text-sukem-text mb-4">
        Ủng hộ Dự án
      </h1>
      
      {/* Text muted cho mô tả */}
      <p className="text-sukem-text-muted mb-8 sm:mb-10 max-w-lg mx-auto leading-relaxed">
        SukemNovel là dự án miễn phí. Sự ủng hộ của bạn, dù nhỏ, là nguồn động lực lớn để chúng tôi duy trì và phát triển trang web tốt hơn. Xin chân thành cảm ơn!
      </p>

      {/* Khối QR Code: Sử dụng bg-sukem-card và border-sukem-border */}
      <div className="bg-sukem-card p-6 sm:p-8 rounded-2xl shadow-xl inline-block border border-sukem-border">
        <img
          src={qrCodeImage}
          alt="Mã QR thanh toán VietQR"
          className="w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-lg border-4 border-sukem-bg object-cover shadow-md"
        />
        <p className="mt-5 font-semibold text-sukem-text text-lg">
          Quét mã VietQR
        </p>
        <p className="text-sm text-sukem-text-muted mt-1">
          (Hỗ trợ hầu hết ứng dụng ngân hàng & ví điện tử)
        </p>
      </div>

      {/* Nút bấm */}
      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
        <a
          href={qrCodeImage}
          download="sukem-novel-qr-donate.png"
          // Button chính dùng màu Primary
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-sukem-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sukem-primary"
        >
          <ArrowDownTrayIcon className="h-5 w-5"/>
          <span>Tải về mã QR</span>
        </a>
        
        {/* Nút disabled */}
        <button
          disabled
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-sukem-border text-sukem-text-muted font-semibold rounded-lg cursor-not-allowed opacity-70"
        >
          Thanh toán Online (Sắp ra mắt)
        </button>
      </div>

      {/* Link về trang chủ dùng màu Accent */}
      <div className="mt-16 border-t border-sukem-border pt-6">
        <Link to="/" className="inline-flex items-center justify-center gap-1.5 text-sm text-sukem-accent hover:text-sukem-primary transition-colors font-medium group">
          <HomeIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1 duration-200" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    </div>
  );
};

export default DonatePage;