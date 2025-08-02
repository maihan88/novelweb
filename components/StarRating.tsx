
import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

interface StarRatingProps {
  rating: number;
  count: number;
  userRating?: number;
  onRate: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, count, userRating, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating > 0 ? hoverRating : userRating || rating;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = (displayRating - fullStars) >= 0.5;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          let starClass = "text-slate-300 dark:text-slate-600";
          
          if (starValue <= fullStars) {
            starClass = "text-yellow-400";
          } else if (starValue === fullStars + 1 && hasHalfStar) {
            // This component doesn't render half stars, it rounds to nearest full for display
            starClass = "text-yellow-400";
          }
          
          // Override with hover/user rating
          if(hoverRating > 0 && starValue <= hoverRating) {
             starClass = "text-yellow-400";
          } else if (hoverRating === 0 && userRating && starValue <= userRating) {
             starClass = "text-yellow-400";
          }

          return (
            <StarIcon
              key={starValue}
              className={`h-6 w-6 cursor-pointer transition-transform duration-150 ${starClass} ${hoverRating >= starValue ? 'scale-110' : ''}`}
              onMouseEnter={() => setHoverRating(starValue)}
              onClick={() => onRate(starValue)}
            />
          );
        })}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <span className="font-bold text-slate-700 dark:text-slate-200">{rating.toFixed(1)}/5</span>
        <span className="mx-1">·</span>
        <span>({count.toLocaleString('vi-VN')} đánh giá)</span>
        {userRating && (
            <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">(Bạn đã đánh giá {userRating} sao)</span>
        )}
      </div>
    </div>
  );
};

export default StarRating;