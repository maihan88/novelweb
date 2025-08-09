import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="w-8 h-8 border-4 border-t-orange-500 border-orange-100 dark:border-amber-200 rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;