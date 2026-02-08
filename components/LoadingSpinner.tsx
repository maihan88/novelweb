import React from 'react';

type Size = 'sm' | 'md' | 'lg' | string;
interface LoadingSpinnerProps {
  size?: Size;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-20 h-20' : (typeof size === 'string' && /w-|h-/.test(size) ? size : 'w-12 h-12');
  const paddingClass = size === 'sm' ? 'p-1' : 'p-4';

  return (
    <div className={`flex justify-center items-center ${paddingClass}`}>
      <div className="relative">
        {/* Vòng tròn nền */}
        <div className={`${sizeClass} rounded-full border-4 border-sukem-border opacity-30`} />
        {/* Vòng tròn xoay - Dùng màu Primary */}
        <div className={`absolute top-0 left-0 ${sizeClass} rounded-full border-4 border-t-sukem-primary border-r-sukem-primary border-b-transparent border-l-transparent animate-spin`} />
      </div>
    </div>
  );
};

export default LoadingSpinner;