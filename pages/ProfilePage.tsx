import React, { useState, useMemo } from 'react';
import { useStories } from '../contexts/StoryContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
    HeartIcon, 
    BookOpenIcon, 
    ArrowRightIcon, 
    UserCircleIcon,
    ClockIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/solid';
import StoryCard from '../components/StoryCard';

// --- CONFIG ---
const INITIAL_READING_LIMIT = 4;
const INITIAL_FAVORITE_LIMIT = 6;

// --- UTILS ---
const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    } catch (e) {
        return '';
    }
};

const ProfilePage: React.FC = () => {
  const { stories } = useStories();
  const { favorites, bookmarks } = useUserPreferences();
  const { currentUser } = useAuth();

  // --- STATE ---
  const [isReadingExpanded, setIsReadingExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);

  // Kiểm tra quyền truy cập
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // --- DATA PROCESSING ---
  const { processedReadingStories, processedFavoriteStories } = useMemo(() => {
    const safeStories = Array.isArray(stories) ? stories.filter(s => s && s.id) : [];

    // 1. Lọc truyện yêu thích
    const favoriteStories = safeStories.filter(story => 
        favorites && favorites.includes(story.id)
    );

    // 2. Xử lý lịch sử đọc
    const readingStories = Object.entries(bookmarks || {})
      .map(([storyId, bookmark]) => {
        const story = safeStories.find(s => s.id === storyId);
        
        if (!story || !bookmark || !bookmark.chapterId) return null;

        // --- CORE LOGIC: Ưu tiên lấy Title từ Bookmark (O(1)) ---
        let volumeTitle = bookmark.volumeTitle || '';
        let chapterTitle = bookmark.chapterTitle || '';
        
        // --- FALLBACK LOGIC: Nếu dữ liệu cũ chưa có Title, tìm thủ công (O(N)) ---
        if (!chapterTitle || !volumeTitle) {
            chapterTitle = 'Chương đã đọc'; // Giá trị mặc định an toàn
            if (story.volumes && Array.isArray(story.volumes)) {
                for (const vol of story.volumes) {
                    if (vol.chapters && Array.isArray(vol.chapters)) {
                        const chapter = vol.chapters.find(c => String(c.id) === String(bookmark.chapterId));
                        if (chapter) {
                            if (!volumeTitle) volumeTitle = vol.title;
                            if (!bookmark.chapterTitle) chapterTitle = chapter.title;
                            break; 
                        }
                    }
                }
            }
        }

        return {
          ...story,
          continueChapterId: bookmark.chapterId,
          lastReadVolumeTitle: volumeTitle,   
          lastReadChapterTitle: chapterTitle, 
          progress: typeof bookmark.progress === 'number' ? bookmark.progress : 0,
          lastReadDate: bookmark.lastRead,
        };
      })
      .filter((story): story is NonNullable<typeof story> => story !== null)
      .sort((a, b) => {
          const dateA = a.lastReadDate ? new Date(a.lastReadDate).getTime() : 0;
          const dateB = b.lastReadDate ? new Date(b.lastReadDate).getTime() : 0;
          return dateB - dateA;
      });

    return {
      processedReadingStories: readingStories,
      processedFavoriteStories: favoriteStories
    };
  }, [stories, favorites, bookmarks]);

  // --- LOGIC SLICE ---
  const visibleReadingStories = isReadingExpanded 
      ? processedReadingStories 
      : processedReadingStories.slice(0, INITIAL_READING_LIMIT);

  const visibleFavoriteStories = isFavoritesExpanded 
      ? processedFavoriteStories 
      : processedFavoriteStories.slice(0, INITIAL_FAVORITE_LIMIT);

  // --- SUB-COMPONENT: Reading Card (Đã tối ưu Responsive Mobile) ---
  const ReadingStoryCard: React.FC<typeof processedReadingStories[0]> = (story) => (
      <div className="group relative bg-sukem-card rounded-xl p-2.5 sm:p-3 shadow-sm border border-sukem-border flex gap-3 overflow-hidden transition-colors duration-300">
        {/* Cover Image: Responsive sizes */}
        <Link to={`/story/${story.id}`} className="relative flex-shrink-0 w-[70px] h-[105px] sm:w-24 sm:h-36 rounded-lg overflow-hidden shadow-inner">
            <img 
                src={story.coverImage} 
                alt={story.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x200?text=No+Cover'; }}
            />
        </Link>

        {/* Content Container */}
        <div className="flex-grow flex flex-col justify-between py-0.5 min-w-0">
            <div>
                {/* Title */}
                <Link to={`/story/${story.id}`}>
                    <h3 className="font-bold text-sukem-text text-sm sm:text-lg leading-tight line-clamp-1 mb-1 hover:text-sukem-primary transition-colors" title={story.title}>
                        {story.title}
                    </h3>
                </Link>
                <p className="text-xs text-sukem-text-muted mb-2 line-clamp-1">{story.author}</p>
                
                {/* Info Box: Progress & Chapter */}
                <div className="bg-sukem-bg rounded-md p-2 border border-sukem-border/50">
                    
                    {/* Dòng 1: Tên Tập (Nhỏ, Mờ) */}
                    {story.lastReadVolumeTitle && (
                         <div className="text-[10px] sm:text-xs text-sukem-text-muted font-medium truncate mb-0.5">
                            {story.lastReadVolumeTitle}
                         </div>
                    )}

                    {/* Dòng 2: Tên Chương + % (Flex Fluid Layout) */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sukem-text font-semibold text-[11px] sm:text-sm truncate flex-1 min-w-0" title={story.lastReadChapterTitle}>
                            {story.lastReadChapterTitle}
                        </span>
                        <span className="text-sukem-accent font-bold text-[10px] sm:text-xs shrink-0 whitespace-nowrap">
                            {Math.round(story.progress)}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-sukem-border/50 rounded-full h-1">
                        <div 
                            className="bg-sukem-accent h-1 rounded-full transition-all duration-500" 
                            style={{ width: `${story.progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Footer: Date & Button */}
            <div className="flex items-end justify-between mt-2">
                <span className="text-[10px] text-sukem-text-muted flex items-center gap-1 shrink-0">
                    <ClockIcon className="h-3 w-3" />
                    {formatDate(story.lastReadDate)}
                </span>
                
                <Link
                  to={`/story/${story.id}/chapter/${story.continueChapterId}`}
                  className="flex items-center gap-1 text-[10px] sm:text-sm font-bold text-white bg-sukem-primary hover:bg-red-500 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-sm transition-all active:scale-95 shrink-0 ml-2"
                >
                  Đọc tiếp <ArrowRightIcon className="h-3 w-3" />
                </Link>
            </div>
        </div>
      </div>
  );

  return (
    <div className="animate-fade-in pb-20 max-w-5xl mx-auto text-sukem-text">
      
      {/* --- HEADER PROFILE --- */}
      <div className="relative mb-8 sm:mb-12 mt-4 sm:mt-8 px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full sm:w-3/4 h-32 bg-sukem-secondary/30 blur-[50px] rounded-full -z-10"></div>
          
          <div className="text-center">
              <div className="relative inline-block">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto rounded-full bg-sukem-card p-1 shadow-lg border border-sukem-border">
                        <div className="w-full h-full rounded-full bg-sukem-bg flex items-center justify-center overflow-hidden">
                            <UserCircleIcon className="w-full h-full text-sukem-text-muted" />
                        </div>
                  </div>
              </div>

              <h1 className="mt-3 text-xl sm:text-3xl font-extrabold text-sukem-text tracking-tight truncate px-4">
                  {currentUser.username}
              </h1>
              <p className="text-sukem-text-muted text-xs sm:text-sm font-medium mt-0.5">Thành viên tích cực</p>

              <div className="flex flex-wrap justify-center gap-3 mt-4 sm:mt-6">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-sukem-card rounded-full shadow-sm border border-sukem-border">
                      <BookOpenIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sukem-secondary"/>
                      <span className="text-xs sm:text-sm font-semibold text-sukem-text whitespace-nowrap">
                        {processedReadingStories.length} <span className="text-sukem-text-muted font-normal">Đang đọc</span>
                      </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-sukem-card rounded-full shadow-sm border border-sukem-border">
                      <HeartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sukem-primary"/>
                      <span className="text-xs sm:text-sm font-semibold text-sukem-text whitespace-nowrap">
                        {processedFavoriteStories.length} <span className="text-sukem-text-muted font-normal">Yêu thích</span>
                      </span>
                  </div>
              </div>
          </div>
      </div>

      <div className="space-y-8 sm:space-y-12 px-3 sm:px-6"> 
        {/* Adjusted padding px-3 for mobile to have more space for content */}
          
        {/* --- SECTION: TRUYỆN ĐANG ĐỌC --- */}
        <section>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-sukem-text flex items-center gap-2 sm:gap-3">
                    <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sukem-secondary/20 text-sukem-secondary">
                        <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5"/>
                    </span>
                    Đọc tiếp
                </h2>
                
                {processedReadingStories.length > INITIAL_READING_LIMIT && (
                    <button 
                        onClick={() => setIsReadingExpanded(!isReadingExpanded)}
                        className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-sukem-text-muted hover:text-sukem-primary transition-colors bg-sukem-card border border-sukem-border px-2 py-1 rounded-md"
                    >
                        {isReadingExpanded ? 'Thu gọn' : 'Xem thêm'}
                        {isReadingExpanded ? <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4"/> : <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4"/>}
                    </button>
                )}
            </div>

            {processedReadingStories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {visibleReadingStories.map(story => (
                        <ReadingStoryCard key={story.id} {...story} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 bg-sukem-card rounded-xl border border-dashed border-sukem-border">
                    <BookOpenIcon className="h-10 w-10 text-sukem-border mb-2" />
                    <p className="text-sukem-text-muted text-sm font-medium">Bạn chưa đọc truyện nào gần đây.</p>
                </div>
            )}
        </section>

        {/* --- SECTION: TRUYỆN YÊU THÍCH --- */}
        <section>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-sukem-text flex items-center gap-2 sm:gap-3">
                    <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sukem-primary/20 text-sukem-primary">
                        <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5"/>
                    </span>
                    Yêu thích
                </h2>

                 {processedFavoriteStories.length > INITIAL_FAVORITE_LIMIT && (
                    <button 
                        onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
                        className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-sukem-text-muted hover:text-sukem-primary transition-colors bg-sukem-card border border-sukem-border px-2 py-1 rounded-md"
                    >
                        {isFavoritesExpanded ? 'Thu gọn' : 'Xem thêm'}
                        {isFavoritesExpanded ? <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4"/> : <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4"/>}
                    </button>
                )}
            </div>
            
            {processedFavoriteStories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 sm:gap-y-8">
                    {visibleFavoriteStories.map(story => (
                        <StoryCard key={story.id} story={story} />
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center py-8 px-4 bg-sukem-card rounded-xl border border-dashed border-sukem-border">
                    <HeartIcon className="h-10 w-10 text-sukem-border mb-2" />
                    <p className="text-sukem-text-muted text-sm font-medium">Chưa có truyện yêu thích.</p>
                    <Link to="/" className="mt-2 text-xs font-bold text-sukem-accent hover:underline">
                        Khám phá ngay
                    </Link>
                </div>
            )}
        </section>

      </div>
    </div>
  );
};

export default ProfilePage;