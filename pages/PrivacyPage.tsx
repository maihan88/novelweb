import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] bg-sukem-bg text-sukem-text py-20 animate-fade-in flex flex-col items-center justify-center">
      <div className="max-w-md w-full px-4 text-center">
        
        <div className="bg-sukem-card p-8 rounded-2xl shadow-sm border border-sukem-border flex flex-col items-center">
          <div className="p-3 bg-sukem-bg rounded-full mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold font-serif mb-3 text-sukem-text">
            Chính Sách Bảo Mật
          </h1>
          
          <p className="text-sukem-text-muted mb-6 leading-relaxed">
            Chúng tôi cam kết bảo vệ thông tin của bạn. Nội dung chi tiết về chính sách sẽ được cập nhật sau.
          </p>
          
          <Link 
            to="/" 
            className="px-6 py-2 bg-sukem-bg border border-sukem-border rounded-full text-sm font-medium text-sukem-text hover:border-sukem-primary hover:text-sukem-primary transition-all"
          >
            Quay lại trang chủ
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;