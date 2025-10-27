import React from 'react';

// === CẢI TIẾN GIAO DIỆN SPINNER ===
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'; // Thêm tùy chọn kích thước
    className?: string; // Cho phép truyền thêm class tùy chỉnh
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-4',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <div className={`flex justify-center items-center p-4 ${className}`}>
            <div className={`
                ${sizeClasses[size]}
                border-t-orange-500 dark:border-t-amber-400
                border-orange-100 dark:border-stone-700
                rounded-full animate-spin
            `}></div>
        </div>
    );
};

export default LoadingSpinner;
