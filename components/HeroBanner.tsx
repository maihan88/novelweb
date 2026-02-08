import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import * as storyService from '../services/storyService';
import { FireIcon } from '@heroicons/react/24/solid';

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

  const currentStory = stories[currentIndex];

  // Loading skeleton - Dùng màu Sukem Card
  if (loading) return <div className="h-[450px] w-full bg-sukem-card animate-pulse rounded-2xl border border-sukem-border"></div>;

  // Fallback
  if (stories.length === 0) {
    return (
        <div className="text-center rounded-2xl p-10 md:p-16 bg-gradient-to-br from-sukem-primary via-sukem-accent to-sukem-primary shadow-2xl shadow-sukem-primary/30 text-white">
            <h1 className="text-4xl font-extrabold font-serif tracking-tight sm:text-5xl md:text-6xl drop-shadow-lg">
            Khám Phá Thế Giới SukemNovel
            </h1>
            <p className="mt-4 max-w-md mx-auto text-base text-white/90 sm:text-lg md:mt-6 md:text-xl md:max-w-3xl">
            Đắm chìm trong những câu chuyện ngọt ngào nhất
            </p>
        </div>
    );
  }

  return (
    <div className="relative h-[65vh] md:h-[60vh] max-h-[500px] min-h-[400px] w-full overflow-hidden rounded-2xl group shadow-lg border border-sukem-border bg-sukem-card">
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
                className={`absolute inset-0 w-full h-full bg-cover transition-opacity duration-[1500ms] ease-in-out ${dynamicClasses}`}
                style={{ backgroundImage: `url(${story.coverImage})` }}
            />
         );
      })}
      
      {/* Overlay: Gradient tối dần từ dưới lên để làm nổi text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

      <div className="relative h-full w-full flex flex-col items-center justify-end gap-4 text-center p-6 pb-12 sm:p-8 sm:pb-16 md:pb-12">
        <div className="relative z-10 text-white animate-fade-in max-w-4xl">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sukem-primary/80 backdrop-blur-sm text-xs font-bold mb-2 border border-white/20">
               <span>{currentStory.chapterCount || 0} Chương</span>
           </div>
           
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight drop-shadow-lg mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-sukem-secondary to-white">
            {currentStory.title}
          </h1>
          
          <p className="mt-3 text-sm sm:text-base text-white/90 drop-shadow max-w-2xl mx-auto line-clamp-2 leading-relaxed">
             {currentStory.alias && currentStory.alias.length > 0
                ? (Array.isArray(currentStory.alias) ? currentStory.alias.join(' · ') : currentStory.alias)
                : currentStory.description}
          </p>

          <div className="flex flex-wrap gap-2 mt-4 sm:mt-5 justify-center">
              {currentStory.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-xs font-medium border border-white/30 bg-white/10 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                  {tag}
                </span>
              ))}
          </div>
          
          {currentStory.firstChapterId && (
            <Link
                to={`/story/${currentStory.id}/chapter/${currentStory.firstChapterId}`}
                className="mt-6 inline-flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-sukem-primary to-sukem-accent text-white font-bold rounded-full shadow-lg shadow-sukem-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
                Đọc Ngay &rarr;
            </Link>
           )}
        </div>
      </div>
      
       {/* Dots Navigation */}
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
        {stories.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-sukem-primary w-6' : 'bg-white/40 w-1.5 hover:bg-white/80'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;