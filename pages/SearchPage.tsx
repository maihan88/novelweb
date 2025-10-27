import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // Thêm Link
import { useStories } from '../contexts/StoryContext.tsx';
import StoryCard from '../components/StoryCard.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Thêm icon

const SearchPage: React.FC = () => {
  const { stories, loading } = useStories();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const filteredStories = useMemo(() => {
    if (!query) {
      return [];
    }
    const safeStories = Array.isArray(stories) ? stories : [];
    const lowerCaseQuery = query.toLowerCase();
    // Tìm kiếm cả trong tên truyện, tác giả và tên khác (alias)
    return safeStories.filter(story =>
      story.title.toLowerCase().includes(lowerCaseQuery) ||
      story.author.toLowerCase().includes(lowerCaseQuery) ||
      (Array.isArray(story.alias) && story.alias.some(a => a.toLowerCase().includes(lowerCaseQuery)))
    );
  }, [stories, query]);

  // --- CẢI TIẾN GIAO DIỆN ---
  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto"> {/* Thêm max-width */}
      <section>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 font-serif text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-4">
          Kết quả tìm kiếm cho: <span className="text-orange-600 dark:text-amber-400">"{query}"</span>
          <span className="ml-2 text-base font-normal text-slate-500 dark:text-slate-400">({filteredStories.length} truyện)</span> {/* Hiển thị số kết quả */}
        </h1>
        {loading ? (
            // Spinner lớn hơn và căn giữa
            <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-t-orange-500 border-orange-100 dark:border-t-amber-400 dark:border-stone-700 rounded-full animate-spin"></div>
            </div>
        ) : filteredStories.length > 0 ? (
          // Giữ nguyên grid layout
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {filteredStories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          // Thông báo không có kết quả rõ ràng hơn
          <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
             <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Không tìm thấy kết quả
            </p>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Rất tiếc, không có truyện nào phù hợp với từ khóa "<span className="font-semibold">{query}</span>". Vui lòng thử tìm kiếm với từ khóa khác.
            </p>
             <Link to="/" className="mt-6 inline-block text-sm font-medium text-orange-600 dark:text-amber-400 hover:underline">
                Quay lại trang chủ
             </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchPage;
