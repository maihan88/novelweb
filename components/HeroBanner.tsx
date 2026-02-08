import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import * as storyService from '../services/storyService'; // Đã sửa: Bỏ đuôi .ts để tránh lỗi import
interface BannerStory extends Omit<Story, 'lastUpdatedAt'> {
  chapterCount?: number;
  firstChapterId?: string;
  lastUpdatedAt?: string;
}

interface HeroBannerProps {
  interval?: number;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ interval = 7000 }) => {
  const [stories, setStories] = useState<BannerStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);

  // --- TỰ ĐỘNG GỌI API BANNER ---
  useEffect(() => {
    const fetchBanners = async () => {
        try {
            const data = await storyService.getBannerStories();
            setStories(data);
        } catch (error) {
            console.error('Failed to load banner:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchBanners();
  }, []);

  const changeSlide = useCallback((newIndex: number) => {
      setPreviousIndex(currentIndex);
      setCurrentIndex(newIndex);
  }, [currentIndex]);

  const nextSlide = useCallback(() => {
    if (stories.length > 1) {
        const isLastSlide = currentIndex === stories.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        changeSlide(newIndex);
    }
  }, [currentIndex, stories.length, changeSlide]);
  
  const goToSlide = (slideIndex: number) => {
      if (slideIndex !== currentIndex) {
        changeSlide(slideIndex);
      }
  }

  useEffect(() => {
    if (stories.length > 1) {
      const slideInterval = setInterval(nextSlide, interval);
      return () => clearInterval(slideInterval);
    }
  }, [nextSlide, interval, stories.length]);

  // Tính toán dữ liệu trước khi early return
  const currentStory = stories[currentIndex];

  // Loading skeleton
  if (loading) return <div className="h-[450px] w-full bg-slate-800 animate-pulse rounded-lg"></div>;

  // Fallback khi chưa có banner nào được set
  if (stories.length === 0) {
    return (
        <div className="text-center rounded-lg p-10 md:p-16 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-400 shadow-2xl shadow-orange-500/30">
            <h1 className="text-4xl font-extrabold font-serif tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-lg">
            Khám Phá Thế Giới SukemNovel
            </h1>
            <p className="mt-4 max-w-md mx-auto text-base text-orange-100 sm:text-lg md:mt-6 md:text-xl md:max-w-3xl">
            Đắm chìm trong những câu chuyện hấp dẫn
            </p>
        </div>
    );
  }


  return (
    <div className="relative h-[75vh] md:h-[70vh] max-h-[550px] min-h-[450px] w-full overflow-hidden rounded-lg group shadow-2xl bg-slate-900">
      {stories.map((story, index) => {
         const isUp = index % 2 === 0;
         const animationClass = isUp ? 'animate-pan-up' : 'animate-pan-down';
         const endPositionClass = isUp ? 'bg-[50%_20%]' : 'bg-[50%_80%]';

         const isActive = index === currentIndex;
         const isPrevious = index === previousIndex;

         let dynamicClasses = 'opacity-0'; 
         if (isActive) {
             dynamicClasses = `opacity-100 ${animationClass}`;
         } else if (isPrevious) {
             dynamicClasses = `opacity-0 ${endPositionClass}`;
         }

         return (
            <div
                key={story.id}
                className={`
                    absolute inset-0 w-full h-full bg-cover 
                    transition-opacity duration-[1500ms] ease-in-out
                    ${dynamicClasses}
                `}
                style={{ backgroundImage: `url(${story.coverImage})` }}
            />
         );
      })}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20"></div>

      <div className="relative h-full w-full flex flex-col items-center justify-end gap-4 text-center p-6 pb-12 sm:p-8 sm:pb-16 md:pb-20">
        <div className="relative z-10 text-white animate-fade-in">
           <p className="font-semibold text-slate-200">Chapter: {currentStory.chapterCount || 0}</p>
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight drop-shadow-lg mt-1 sm:mt-2">
            {currentStory.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 drop-shadow max-w-2xl mx-auto line-clamp-2">
             {currentStory.alias && currentStory.alias.length > 0
        ? (Array.isArray(currentStory.alias) ? currentStory.alias.join(' · ') : currentStory.alias)
        : currentStory.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-5 justify-center">
              {currentStory.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-xs font-medium border border-white/30 bg-white/10 text-slate-200 px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
          </div>
          {currentStory.firstChapterId && (
            <Link
                to={`/story/${currentStory.id}/chapter/${currentStory.firstChapterId}`}
                className="mt-4 sm:mt-5 inline-block px-6 py-2 sm:px-8 sm:py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-full shadow-lg hover:shadow-amber-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 dark:focus:ring-offset-stone-900"
            >
                Đọc Ngay &rarr;
            </Link>
           )}
        </div>
      </div>
     
       <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2">
        {stories.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'}`}
            aria-label={`Go to slide ${index + 1}`}
            disabled={stories.length <= 1}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
