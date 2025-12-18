import React from 'react'; // Bỏ useState, useMemo vì không còn filter
import { useStories } from '../contexts/StoryContext.tsx';
import StoryCard from '../components/StoryCard.tsx';
import HeroBanner from '../components/HeroBanner.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
// Thêm icons cho tiêu đề sections
import { FireIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/solid';

// Helper component cho tiêu đề section
const SectionHeader: React.FC<{ title: string; icon: React.ElementType }> = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-orange-200 dark:border-stone-700 pb-3">
        <Icon className="h-6 w-6 text-orange-500 dark:text-amber-400" />
        <h2 className="text-2xl font-bold font-serif text-orange-950 dark:text-amber-100">
            {title}
        </h2>
    </div>
);


const HomePage: React.FC = () => {
  const { stories, loading, error } = useStories();
  // Bỏ state filter vì không dùng nữa
  // const [statusFilter, setStatusFilter] = useState<'all' | 'Đang dịch' | 'Hoàn thành'>('all');
  // const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sắp xếp và lọc trực tiếp trong render hoặc dùng useMemo nếu cần hiệu năng cao hơn
  const safeStories = Array.isArray(stories) ? stories : [];

  const bannerStories = safeStories.filter(s => s.isInBanner);
  const hotStories = safeStories.filter(s => s.isHot).slice(0, 12); // Giới hạn số lượng hiển thị nếu cần

  const newlyUpdatedStories = [...safeStories]
      .sort((a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime())
      .slice(0, 18); // Hiển thị nhiều hơn một chút

  if (loading) {
    // Thêm hiệu ứng loading cho toàn trang
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <LoadingSpinner />
        <p className="mt-4 text-slate-500 dark:text-stone-400">Đang tải truyện...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-8 rounded-lg">
        <p className="font-semibold">Đã xảy ra lỗi khi tải dữ liệu.</p>
        <p className="text-sm mt-1">{error}</p>
        {/* Có thể thêm nút thử lại */}
        {/* <button onClick={fetchStories} className="...">Thử lại</button> */}
      </div>
    );
  }

  const gridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8";

  return (
    // Tăng khoảng cách giữa các section
    <div className="animate-fade-in space-y-12 md:space-y-16">
      {/* Hero Section */}
      <HeroBanner /> 

      {/* Section Đề cử (Truyện Hot) */}
      {hotStories.length > 0 && (
        <section>
           {/* Sử dụng SectionHeader */}
           <SectionHeader title="Truyện Đề Cử" icon={FireIcon} />
           <div className={gridClasses}>
              {hotStories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
        </section>
      )}

      {/* Section Mới cập nhật */}
      {newlyUpdatedStories.length > 0 && (
        <section>
           {/* Sử dụng SectionHeader */}
           <SectionHeader title="Mới Cập Nhật" icon={ClockIcon} />
           <div className={gridClasses}>
              {newlyUpdatedStories.map(story => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
        </section>
      )}

      {/* Có thể thêm section "Truyện mới" nếu cần */}
       {/* <section>
           <SectionHeader title="Truyện Mới Đăng" icon={SparklesIcon} />
           <div className={gridClasses}>
               {safeStories.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6).map(story => (
                   <StoryCard key={story.id} story={story} />
               ))}
           </div>
       </section> */}

       {/* Thông báo nếu không có truyện nào */}
       {safeStories.length === 0 && !loading && (
           <div className="text-center py-20 text-slate-500 dark:text-stone-400">
               <p>Oops! Chưa có bộ truyện nào được đăng cả.</p>
               <p className="mt-2">Quay lại sau nhé!</p>
           </div>
       )}
    </div>
  );
};

export default HomePage;
