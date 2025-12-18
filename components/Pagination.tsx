import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    // Helper tạo danh sách trang
    const getPageNumbers = () => {
        const pages = [];
        // Nếu ít trang (<= 7), hiện hết
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Logic hiển thị: 1 ... 4 5 6 ... 20
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-8 select-none">
            {/* Nút Previous */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-orange-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-orange-900 dark:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-100 dark:hover:bg-stone-700 transition-all duration-200 shadow-sm"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {/* Các nút số */}
            {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                    {page === '...' ? (
                        <span className="w-10 h-10 flex items-center justify-center text-stone-400 font-medium">...</span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page as number)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-all duration-200 shadow-sm ${
                                currentPage === page
                                    ? 'bg-orange-500 text-white shadow-orange-200 dark:shadow-none transform scale-110'
                                    : 'bg-white dark:bg-stone-800 border border-orange-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-orange-100 dark:hover:bg-stone-700 hover:border-orange-300 hover:text-orange-900'
                            }`}
                        >
                            {page}
                        </button>
                    )}
                </React.Fragment>
            ))}

            {/* Nút Next */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-orange-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-orange-900 dark:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-100 dark:hover:bg-stone-700 transition-all duration-200 shadow-sm"
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Pagination;