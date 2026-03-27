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

    const baseBtnClass = "w-10 h-10 flex items-center justify-center rounded-xl font-medium font-serif transition-colors duration-300 border active:scale-95";
    const normalBtnClass = "bg-sukem-card border-sukem-border text-sukem-text hover:bg-sukem-primary hover:text-white hover:border-sukem-primary";
    const activeBtnClass = "bg-sukem-primary border-sukem-primary text-white cursor-default select-none shadow-sm";

    return (
        <div className="flex justify-center items-center gap-2 mt-12 mb-8 select-none animate-fade-in">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous Page"
                className={`${baseBtnClass} ${currentPage === 1
                        ? 'opacity-50 cursor-not-allowed bg-sukem-card border-sukem-border text-sukem-text-muted hover:bg-sukem-card hover:text-sukem-text-muted hover:border-sukem-border shadow-none'
                        : normalBtnClass
                    }`}
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1.5 sm:gap-2">
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span className="w-6 sm:w-8 h-10 flex items-center justify-center text-sukem-text-muted font-serif font-medium tracking-[0.2em] text-lg">
                                ...
                            </span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page as number)}
                                disabled={currentPage === page}
                                className={`${baseBtnClass} ${currentPage === page ? activeBtnClass : normalBtnClass}`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
                className={`${baseBtnClass} ${currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed bg-sukem-card border-sukem-border text-sukem-text-muted hover:bg-sukem-card hover:text-sukem-text-muted hover:border-sukem-border shadow-none'
                        : normalBtnClass
                    }`}
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Pagination;