import React, { useState, useEffect } from 'react';
import StoryCard from '../components/StoryCard';
import HeroBanner from '../components/HeroBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { FireIcon, ClockIcon } from '@heroicons/react/24/solid';
import { getStoriesList } from '../services/storyService';
import { Story } from '../types';

// Cập nhật SectionHeader dùng màu Sukem
const SectionHeader: React.FC<{ title: string; icon: React.ElementType; iconColorClass?: string }> = ({ 
    title, 
    icon: Icon,
    iconColorClass = "text-sukem-primary" // Default là màu Primary (Hồng/Đỏ)
}) => (
    <div className="flex items-center gap-3 mb-8 border-b border-sukem-border pb-3 relative">
        <Icon className={`h-7 w-7 ${iconColorClass}`} />
        <h2 className="text-2xl font-bold font-serif text-sukem-text capitalize relative z-10">
            {title}
        </h2>
        {/* Đường line trang trí dưới title */}
        <div className="absolute bottom-[-1px] left-0 w-1/3 h-[2px] bg-gradient-to-r from-sukem-primary to-transparent"></div>
    </div>
);

const HomePage: React.FC = () => {
  const [hotStories, setHotStories] = useState<Story[]>([]);
  const [updatedStories, setUpdatedStories] = useState<Story[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUpdatedLoading, setIsUpdatedLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);
        const [hotRes, updatedRes] = await Promise.all([
          getStoriesList({ page: 1, limit: 12, sort: 'hot' }),
          getStoriesList({ page: 1, limit: 12, sort: 'updated' })
        ]);

        setHotStories(hotRes.stories);
        setUpdatedStories(updatedRes.stories);
        setTotalPages(updatedRes.pagination.totalPages);
        
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handlePageChange = async (page: number) => {
      if (page === currentPage) return;
      
      setIsUpdatedLoading(true);
      setCurrentPage(page);
      
      const section = document.getElementById('updated-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      try {
          const response = await getStoriesList({ 
              page: page, 
              limit: 12, 
              sort: 'updated' 
          });
          setUpdatedStories(response.stories);
          setTotalPages(response.pagination.totalPages);
      } catch (error) {
          console.error("Failed to change page", error);
      } finally {
          setIsUpdatedLoading(false);
      }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8";

  return (
    <div className="animate-fade-in space-y-16 pb-12">
      <HeroBanner />

      {/* Section Truyện Hot */}
      {hotStories.length > 0 && (
        <section className="container mx-auto px-4">
           {/* Dùng màu Primary (Strawberry/Berry Red) cho icon Hot */}
           <SectionHeader title="Truyện Đề Cử" icon={FireIcon} iconColorClass="text-red-500 animate-pulse" />
           <div className={gridClasses}>
              {hotStories.map(story => (
                <StoryCard key={`hot-${story.id}`} story={story} />
              ))}
            </div>
        </section>
      )}

      {/* Section Mới cập nhật */}
      <section id="updated-section" className="scroll-mt-28 container mx-auto px-4">
           {/* Dùng màu Accent (Caramel/Honey) cho icon Thời gian */}
           <SectionHeader title="Mới Cập Nhật" icon={ClockIcon} iconColorClass="text-sukem-accent" />
           
           {isUpdatedLoading ? (
               <div className="min-h-[400px] flex items-center justify-center">
                   <LoadingSpinner />
               </div>
           ) : (
               <>
                   {updatedStories.length > 0 ? (
                        <div className={gridClasses}>
                            {updatedStories.map(story => (
                                <StoryCard key={story.id} story={story} />
                            ))}
                        </div>
                   ) : (
                        <div className="text-center py-16 text-sukem-text-muted italic border-2 border-dashed border-sukem-border rounded-xl">
                            Chưa có truyện nào cập nhật.
                        </div>
                   )}

                   <div className="mt-10">
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                   </div>
               </>
           )}
      </section>
    </div>
  );
};

export default HomePage;