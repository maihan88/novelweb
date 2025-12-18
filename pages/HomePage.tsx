import React, { useState, useEffect } from 'react';
import StoryCard from '../components/StoryCard.tsx';
import HeroBanner from '../components/HeroBanner.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import Pagination from '../components/Pagination.tsx'; // Import component phân trang
import { FireIcon, ClockIcon } from '@heroicons/react/24/solid';
import { getStoriesList } from '../services/storyService.ts';
import { Story } from '../types.ts';

const SectionHeader: React.FC<{ title: string; icon: React.ElementType }> = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-orange-200 dark:border-stone-700 pb-3">
        <Icon className="h-6 w-6 text-orange-500 dark:text-amber-400" />
        <h2 className="text-2xl font-bold font-serif text-orange-950 dark:text-amber-100">
            {title}
        </h2>
    </div>
);

const HomePage: React.FC = () => {
  // State
  const [hotStories, setHotStories] = useState<Story[]>([]);
  const [updatedStories, setUpdatedStories] = useState<Story[]>([]);
  
  // State phân trang cho phần Mới Cập Nhật
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUpdatedLoading, setIsUpdatedLoading] = useState(false);
  
  const [initialLoading, setInitialLoading] = useState(true);

  // 1. Load dữ liệu ban đầu (Hot + Page 1 Updated)
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
        setTotalPages(updatedRes.pagination.totalPages); // Lưu tổng số trang
        
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Xử lý khi chuyển trang (Chỉ load lại phần Updated)
  const handlePageChange = async (page: number) => {
      if (page === currentPage) return;
      
      setIsUpdatedLoading(true);
      setCurrentPage(page);
      
      // Scroll nhẹ lên đầu danh sách cập nhật để user biết đã chuyển trang
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
    <div className="animate-fade-in space-y-12 md:space-y-16 pb-12">
      <HeroBanner />

      {/* Section Truyện Hot - Không phân trang */}
      {hotStories.length > 0 && (
        <section>
           <SectionHeader title="Truyện Đề Cử" icon={FireIcon} />
           <div className={gridClasses}>
              {hotStories.map(story => (
                <StoryCard key={`hot-${story.id}`} story={story} />
              ))}
            </div>
        </section>
      )}

      {/* Section Mới cập nhật - Có phân trang 1, 2, 3 */}
      <section id="updated-section" className="scroll-mt-24">
           <SectionHeader title="Mới Cập Nhật" icon={ClockIcon} />
           
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
                        <div className="text-center py-10 text-slate-500">
                            Chưa có truyện nào cập nhật.
                        </div>
                   )}

                   {/* Component Phân Trang */}
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
