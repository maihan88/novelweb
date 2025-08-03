
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Story } from '../types.ts';

interface HeroBannerProps {
  stories: Story[];
  interval?: number;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ stories, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = React.useCallback(() => {
    if (stories.length > 1) {
        const isLastSlide = currentIndex === stories.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }
  }, [currentIndex, stories.length]);
  
  const goToSlide = (slideIndex: number) => {
      setCurrentIndex(slideIndex);
  }

  useEffect(() => {
    if (stories.length > 1) {
      const slideInterval = setInterval(nextSlide, interval);
      return () => clearInterval(slideInterval);
    }
  }, [currentIndex, stories.length, interval, nextSlide]);

  if (stories.length === 0) {
    // Fallback static banner if no stories are marked for the banner
    return (
        <div className="text-center rounded-lg p-10 md:p-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 shadow-2xl shadow-indigo-500/30">
            <h1 className="text-4xl font-extrabold font-serif tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-lg">
            Khám Phá Thế Giới Truyện Dịch
            </h1>
            <p className="mt-4 max-w-md mx-auto text-base text-indigo-100 sm:text-lg md:mt-6 md:text-xl md:max-w-3xl">
            Đắm chìm trong những câu chuyện hấp dẫn được cộng đồng tâm huyết dịch thuật.
            </p>
        </div>
    );
  }

  const currentStory = stories[currentIndex];

  const { totalChapters, firstChapterId } = useMemo(() => {
     if (!currentStory) return { totalChapters: 0, firstChapterId: null };
     
     const total = currentStory.volumes.reduce((acc, vol) => acc + vol.chapters.length, 0);
     const firstId = currentStory.volumes?.[0]?.chapters?.[0]?.id;

     return { totalChapters: total, firstChapterId: firstId };
  }, [currentStory]);


  return (
    <div className="relative h-[75vh] md:h-[70vh] max-h-[550px] min-h-[450px] w-full overflow-hidden rounded-lg group shadow-2xl bg-slate-900">
      {/* Background Image with Transition */}
      {stories.map((story, index) => (
         <div
          key={story.id}
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${story.coverImage})` }}
        />
      ))}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20"></div>

      {/* Content */}
      <div className="relative h-full w-full flex flex-col items-center justify-end gap-4 text-center p-6 pb-12 sm:p-8 sm:pb-16 md:pb-20">
        <div className="relative z-10 text-white animate-fade-in">
           <p className="font-semibold text-slate-200">Chapter: {totalChapters}</p>
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight drop-shadow-lg mt-1 sm:mt-2">
            {currentStory.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 drop-shadow max-w-2xl mx-auto line-clamp-2">
             {currentStory.alias ? currentStory.alias : currentStory.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-5 justify-center">
              {currentStory.tags.slice(0, 5).map(tag => (
                <span key={tag} className="text-xs font-medium border border-white/30 bg-white/10 text-slate-200 px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
          </div>
          {firstChapterId && (
            <Link
                to={`/story/${currentStory.id}/chapter/${firstChapterId}`}
                className="mt-6 sm:mt-8 inline-block px-8 py-2.5 sm:px-10 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-md shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-105"
            >
                Đọc Ngay &rarr;
            </Link>
           )}
        </div>
      </div>
     
       {/* Navigation Dots */}
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
