import React from 'react';
import BannerManager from '../../components/BannerManager';

const BannerManagementPage: React.FC = () => {
  return (
    <div className="animate-fade-in p-4 lg:p-0 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-serif text-sukem-text mb-2">Quản Lý Banner</h1>
        <p className="text-sukem-text-muted">Cấu hình các truyện hiển thị trên Hero Slider ở Trang chủ.</p>
      </div>

      <div className="w-full bg-sukem-card rounded-2xl shadow-sm border border-sukem-border">
         <BannerManager />
      </div>
    </div>
  );
};

export default BannerManagementPage;