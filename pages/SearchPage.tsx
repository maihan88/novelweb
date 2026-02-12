import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import StoryCard from '../components/StoryCard.tsx';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { storyService } from '../services/storyService.ts';
import { Story } from '../types.ts';

// Helper để hiển thị text label cho khoảng chương
const getRangeLabel = (rangeKey: string) => {
    switch(rangeKey) {
        case '0-50': return '< 50 chương';
        case '50-100': return '50 - 100 chương';
        case '100-200': return '100 - 200 chương';
        case '200-500': return '200 - 500 chương';
        case '500-1000': return '500 - 1000 chương';
        case '1000-max': return '> 1000 chương';
        default: return null;
    }
};

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDocs, setTotalDocs] = useState(0);

  const query = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const chapterRange = searchParams.get('chapterRange') || ''; // Đọc range
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const fetchResults = async () => {
        setLoading(true);
        try {
            const data = await storyService.getStoriesList({
                keyword: query,
                status: status !== 'all' ? status : undefined,
                chapterRange: chapterRange !== 'all' ? chapterRange : undefined, // Gửi range
                page: page,
                limit: 12
            });
            setStories(data.stories);
            setTotalDocs(data.pagination.totalDocs);
        } catch (error) {
            console.error("Search error:", error);
            setStories([]);
        } finally {
            setLoading(false);
        }
    };

    fetchResults();
  }, [query, status, chapterRange, page]);

  // UI Filter badges
  const activeFilters = [
      status && status !== 'all' ? (status === 'ongoing' ? 'Trạng thái: Đang ra' : (status === 'completed' ? 'Trạng thái: Hoàn thành' : null)) : null,
      getRangeLabel(chapterRange) // Hiển thị label đẹp
  ].filter(Boolean);

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto px-4 py-8 text-sukem-text min-h-[60vh]">
      <section>
        <div className="mb-8 border-b border-sukem-border pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-sukem-text flex items-center gap-3">
              <MagnifyingGlassIcon className="h-8 w-8 text-sukem-primary"/>
              Kết quả tìm kiếm
            </h1>
            
            <div className="mt-3 text-sukem-text-muted flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                    <span>Từ khóa: <span className="font-bold text-sukem-primary text-lg">"{query}"</span></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Tìm thấy <span className="font-bold text-sukem-text">{totalDocs}</span> truyện</span>
                </div>
                
                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {activeFilters.map((f, idx) => (
                            <span key={idx} className="px-3 py-1 text-xs font-medium bg-sukem-bg border border-sukem-border rounded-full text-sukem-accent shadow-sm">
                                {f}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
        
        {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-t-sukem-primary border-sukem-border rounded-full animate-spin mb-4"></div>
                <p className="text-sukem-text-muted animate-pulse">Đang tìm truyện...</p>
            </div>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {stories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-sukem-card rounded-2xl shadow-sm border border-sukem-border max-w-2xl mx-auto">
             <div className="bg-sukem-bg w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FunnelIcon className="h-10 w-10 text-sukem-text-muted" />
             </div>
            <p className="text-xl font-bold text-sukem-text mb-3">
                Không tìm thấy kết quả nào
            </p>
            <p className="text-sukem-text-muted mb-8">
                Rất tiếc, không có truyện nào phù hợp với các tiêu chí lọc hiện tại.
            </p>
             <Link to="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-sukem-primary hover:bg-opacity-90 transition-all shadow-md hover:-translate-y-0.5">
                Quay lại trang chủ
             </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchPage;