import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
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

    // Class cơ bản cho nút
    const baseBtnClass = "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm border";
    
    // Class cho trạng thái bình thường (chưa active)
    const normalBtnClass = "bg-sukem-card border-sukem-border text-sukem-text hover:bg-sukem-primary hover:text-white hover:border-transparent";
    
    // Class cho trạng thái active
    const activeBtnClass = "bg-sukem-primary border-sukem-primary text-white transform scale-110 shadow-md shadow-sukem-primary/30";

    return (
        <div className="flex justify-center items-center gap-2 mt-12 select-none animate-fade-in">
            {/* Nút Previous */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${baseBtnClass} ${normalBtnClass} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sukem-card disabled:hover:text-sukem-text`}
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {/* Các nút số */}
            {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                    {page === '...' ? (
                        <span className="w-10 h-10 flex items-center justify-center text-sukem-text-muted font-serif font-medium">...</span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page as number)}
                            className={`${baseBtnClass} ${currentPage === page ? activeBtnClass : normalBtnClass} font-medium font-serif`}
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
                className={`${baseBtnClass} ${normalBtnClass} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sukem-card disabled:hover:text-sukem-text`}
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Pagination;