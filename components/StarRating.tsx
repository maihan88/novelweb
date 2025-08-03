
import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

interface StarRatingProps {
  rating: number;
  count: number;
  userRating?: number; // User's own rating for this story
  onRate?: (rating: number) => void; // Callback when user rates
}

const StarRating: React.FC<StarRatingProps> = ({ rating, count, userRating, onRate }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = (rating - fullStars) >= 0.5;

  const handleRate = (rateValue: number) => {
    if (onRate) {
        onRate(rateValue);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div 
        className="flex items-center"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          let starClass = "text-slate-300 dark:text-slate-600";
          
          const displayRating = hoverRating ?? userRating ?? rating;

          if (starValue <= displayRating) {
            starClass = "text-yellow-400";
          } else if (userRating === undefined && hoverRating === null && starValue === fullStars + 1 && hasHalfStar) {
            // This logic for half-star display should only apply when not hovering or rated by user
            starClass = "text-yellow-400"; // Simplification: show full star for half-star
          }
          
          return (
            <StarIcon
              key={starValue}
              className={`h-6 w-6 transition-all duration-150 ${onRate ? 'cursor-pointer' : ''} ${starClass}`}
              onMouseEnter={() => onRate && setHoverRating(starValue)}
              onClick={() => handleRate(starValue)}
            />
          );
        })}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <span className="font-bold text-slate-700 dark:text-slate-200">{rating.toFixed(1)}/5</span>
        <span className="mx-1">·</span>
        <span>({count.toLocaleString('vi-VN')} đánh giá)</span>
        {userRating && <span className="ml-2 text-indigo-500 font-semibold">(Bạn đã đánh giá {userRating} sao)</span>}
      </div>
    </div>
  );
};

export default StarRating;
