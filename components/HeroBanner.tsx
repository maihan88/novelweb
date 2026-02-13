import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types';
import { storyService } from '../services/storyService';
import { usePalette } from '../hooks/usePalette';

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

  // Hook usePalette cần xử lý trường hợp currentStory chưa có
  const { data: palette } = usePalette(currentStory?.coverImage || '');

  // Màu 1: Ưu tiên màu sáng nhất
  const color1 = palette.lightVibrant || '#fde68a'; 
  
  // Màu 2: Tạo gradient
  const color2 = (palette.vibrant !== color1 ? palette.vibrant : null) || palette.lightMuted || '#ffffff';

  // Style Gradient + Viền trắng cho Text
  const gradientStyle: React.CSSProperties = {
      backgroundImage: `linear-gradient(to right bottom, ${color1}, ${color2})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      filter: `drop-shadow(0 0 15px ${color1}50)`,
      
      // Viền trắng mảnh xung quanh chữ
      WebkitTextStroke: '0.5px rgba(255, 255, 255, 0.8)', 
  };

  if (loading) return <div className="h-[450px] w-full bg-sukem-card animate-pulse rounded-2xl border border-sukem-border"></div>;

  if (stories.length === 0) {
    return (
        <div className="text-center rounded-2xl p-10 md:p-16 bg-gradient-to-br from-sukem-primary via-sukem-accent to-sukem-primary shadow-2xl shadow-sukem-primary/30 text-white">
            <h1 className="text-4xl font-extrabold font-serif tracking-tight sm:text-5xl md:text-6xl drop-shadow-lg">
            Khám Phá Thế Giới SukemNovel
            </h1>
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
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10"></div>

      <div className="relative z-20 h-full w-full flex flex-col items-center justify-end gap-3 text-center p-6 pb-14 sm:p-8 sm:pb-16">
        <div className="animate-fade-in max-w-3xl w-full flex flex-col items-center">
           
           {/* Chapter Count Badge */}
           <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-black/40 text-[10px] md:text-xs font-bold mb-1 border border-white/20 text-white shadow-sm">
               <span>{currentStory.chapterCount || 0} Chương</span>
           </div>
           
           {/* Title */}
           <Link 
              to={`/story/${currentStory.id}`} 
              className="group/title block"
           >
                <h1 
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif tracking-tight leading-tight py-2 px-4"
                    style={gradientStyle}
                >
                    {currentStory.title}
                </h1>
           </Link>
          
          {/* Description */}
          <p className="mt-2 text-xs sm:text-sm text-white/90 max-w-lg mx-auto line-clamp-2 leading-relaxed font-medium">
              {currentStory.alias && currentStory.alias.length > 0
                ? (Array.isArray(currentStory.alias) ? currentStory.alias.join(' · ') : currentStory.alias)
                : currentStory.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3 justify-center max-w-xl">
              {currentStory.tags && currentStory.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-[10px] sm:text-xs font-medium border border-white/20 bg-black/30 text-white/90 px-2.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
          </div>

        </div>
      </div>
      
       {/* Dots Navigation */}
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-30">
        {stories.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-5' : 'bg-white/40 w-1 hover:bg-white/80'}`}
            style={{ backgroundColor: currentIndex === index ? color1 : undefined }} 
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;