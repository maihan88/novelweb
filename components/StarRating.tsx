import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

interface StarRatingProps {
  rating: number;
  count: number;
  userRating?: number;
  onRate?: (rating: number) => void;
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
          const displayRating = userRating !== undefined ? rating : (hoverRating ?? rating);

          let fillPercentage = 0;
          if (displayRating >= starValue) {
            fillPercentage = 100;
          } else if (displayRating > starValue - 1) {
            const fraction = displayRating - (starValue - 1);
            fillPercentage = fraction >= 0.5 ? 50 : 0;
          }

          return (
            <div
              key={starValue}
              className={`relative h-6 w-6 ${onRate ? 'cursor-pointer' : ''}`}
              onMouseEnter={() => onRate && setHoverRating(starValue)}
              onClick={() => handleRate(starValue)}
            >
              <StarIcon className="absolute top-0 left-0 h-6 w-6 text-slate-300 dark:text-slate-600 transition-colors duration-150" />
              <div
                className="absolute top-0 left-0 h-full overflow-hidden text-yellow-400 transition-all duration-150"
                style={{ width: `${fillPercentage}%` }}
              >
                <StarIcon className="h-6 w-6 max-w-none" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
        <span className="font-bold text-slate-700 dark:text-slate-200">{rating.toFixed(1)}/5</span>
        <span className="mx-1">·</span>
        {userRating && <span className="ml-2 text-indigo-500 font-semibold">(Bạn đã đánh giá {userRating} sao)</span>}
      </div>
    </div>
  );
};

export default StarRating;