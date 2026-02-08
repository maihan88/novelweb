import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useStories } from '../contexts/StoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StarRating from '../components/StarRating';
import { Story } from '../types';
import { formatDate } from '../utils/formatDate';
import {
    PencilIcon, BookOpenIcon, HeartIcon, CalendarDaysIcon, EyeIcon, UserIcon, TagIcon,
    ListBulletIcon, MagnifyingGlassIcon, ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon
} from '@heroicons/react/24/solid';

const StoryDetailPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { getStoryById, addRatingToStory } = useStories();
  const { currentUser } = useAuth();
  const { isFavorite, toggleFavorite, getUserRating, addRating, bookmarks, removeBookmark  } = useUserPreferences();

  // States
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chapterSearchTerm, setChapterSearchTerm] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Derived states and memos
  const isUserFavorite = storyId ? isFavorite(storyId) : false;
  const userRating = storyId ? getUserRating(storyId) : undefined;
  const currentBookmark = storyId ? bookmarks[storyId] : null;

  const bookmarkedChapterTitle = useMemo(() => {
      if (!currentBookmark || !story) return null;
      const chapter = story.volumes.flatMap(v => v.chapters).find(c => c.id === currentBookmark.chapterId);
      return chapter?.title || null;
  }, [currentBookmark, story]);

  const fetchStory = useCallback(async () => {
    if (!storyId) return;
    setLoading(true);
    setError('');
    try {
      const fetchedStory = await getStoryById(storyId);
      setStory(fetchedStory || null);
      if (!fetchedStory) setError('Không tìm thấy truyện này.');
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải truyện.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [storyId, getStoryById]);

  useEffect(() => {
    fetchStory();
    setIsDescriptionExpanded(false);
    window.scrollTo(0, 0);
  }, [fetchStory]);

  const handleRating = async (rating: number) => {
    if (!currentUser || !storyId) { alert("Bạn cần đăng nhập để đánh giá."); return; }
    if (userRating !== undefined) { alert("Bạn đã đánh giá truyện này rồi."); return; }
    setStory(prev => prev ? {
        ...prev,
        rating: (prev.rating * prev.ratingsCount + rating) / (prev.ratingsCount + 1),
        ratingsCount: prev.ratingsCount + 1
     } : null);
    addRating(storyId, rating);
    try { await addRatingToStory(storyId, rating); }
    catch (e) { alert('Có lỗi xảy ra khi gửi đánh giá.'); fetchStory(); }
  };

  const firstChapter = story?.volumes?.[0]?.chapters?.[0];

  const handleReadFromBeginning = () => {
     if (storyId) removeBookmark(storyId);
     if (firstChapter && story) navigate(`/story/${story.id}/chapter/${firstChapter.id}`);
  };

  const filteredVolumes = useMemo(() => {
    if (!story) return [];
    if (!chapterSearchTerm.trim()) return story.volumes;
    const lowerSearchTerm = chapterSearchTerm.toLowerCase();
    return story.volumes
        .map(volume => ({
            ...volume,
            chapters: volume.chapters.filter(chapter => chapter.title.toLowerCase().includes(lowerSearchTerm))
        }))
        .filter(volume => volume.title.toLowerCase().includes(lowerSearchTerm) || volume.chapters.length > 0);
  }, [story, chapterSearchTerm]);

  if (!storyId) return <Navigate to="/" replace />;
  if (loading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
  if (error || !story) return <div className="text-center py-20 text-sukem-primary">{error || 'Không thể tải thông tin truyện.'}</div>;

  const totalChapters = story.volumes.reduce((acc, vol) => acc + (vol.chapters?.length || 0), 0);
  const statusClasses = story.status === 'Hoàn thành'
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-sukem-primary/10 text-sukem-primary border border-sukem-primary/20';
  const descriptionParagraphs = story.description?.split('\n') || [];
  const descriptionNeedsExpansion = descriptionParagraphs.length > 5;

  // --- START: Component nút bấm riêng biệt ---
  const ActionButtons = () => (
    <div className="flex flex-col gap-3 mt-6">
        {currentBookmark ? (
          <>
            <Link
              to={`/story/${story.id}/chapter/${currentBookmark.chapterId}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-sukem-primary to-sukem-accent text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <BookOpenIcon className="h-5 w-5 flex-shrink-0"/>
              <span className="truncate">Đọc tiếp: {bookmarkedChapterTitle || 'Chương đã lưu'}</span>
            </Link>
            <button
              onClick={handleReadFromBeginning}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-sukem-bg text-sukem-text font-semibold rounded-xl border border-sukem-border hover:bg-sukem-card transition-all"
            >
              <BookOpenIcon className="h-5 w-5"/>
              <span>Đọc lại từ đầu</span>
            </button>
          </>
        ) : ( firstChapter ? (
          <Link
            to={`/story/${story.id}/chapter/${firstChapter.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-sukem-primary to-sukem-accent text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <BookOpenIcon className="h-5 w-5"/>
            <span>Đọc từ đầu</span>
          </Link>
        ) : (
          <div className="text-center p-3 bg-sukem-bg rounded-xl border border-sukem-border text-sukem-text-muted text-sm italic">Truyện chưa có chương.</div>
        ))}

        {currentUser && (
          <button
            onClick={() => storyId && toggleFavorite(storyId)}
            className={`flex items-center justify-center gap-2 w-full px-4 py-3 font-semibold rounded-xl border transition-all duration-300 ${isUserFavorite
                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                : 'bg-sukem-bg text-sukem-text border-sukem-border hover:text-red-500 hover:border-red-200 hover:bg-red-50'
              }`}
          >
            <HeartIcon className={`h-5 w-5 ${isUserFavorite ? 'text-white' : 'text-slate-400 group-hover:text-red-500'}`}/>
            <span>{isUserFavorite ? 'Đã yêu thích' : 'Yêu thích'}</span>
          </button>
        )}

        {currentUser?.role === 'admin' && (
          <button onClick={() => navigate(`/admin/story/edit/${story.id}`)} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-700 text-white font-semibold rounded-xl shadow hover:bg-slate-800 transition-colors">
            <PencilIcon className="h-5 w-5" />
            Chỉnh sửa truyện
          </button>
        )}
    </div>
  );
  // --- END: Component nút bấm riêng biệt ---

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-8">
      {/* Nút quay lại */}
      <div className="px-4 sm:px-0">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sukem-text-muted hover:text-sukem-primary text-sm font-medium group transition-colors">
            <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Về trang chủ
        </Link>
      </div>

      {/* Card thông tin truyện */}
      <div className="bg-sukem-card rounded-2xl shadow-sm overflow-hidden mx-0 sm:mx-0 border border-sukem-border">
        {/* Phần thông tin cơ bản */}
        <div className="flex flex-col md:flex-row gap-6 p-6 md:gap-10 md:p-10">

          {/* Cột trái: Ảnh bìa + Action Button Desktop */}
          <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col items-center">
            <img 
                className="w-48 md:w-full max-w-[280px] rounded-lg shadow-xl aspect-[2/3] object-cover border-4 border-white dark:border-sukem-bg" 
                src={story.coverImage} 
                alt={`Bìa truyện ${story.title}`} 
            />
            <div className="hidden md:block w-full max-w-[280px]">
                <ActionButtons />
            </div>
          </div>

          {/* Cột phải: Thông tin chi tiết */}
          <div className="w-full md:w-2/3 space-y-4">
            <div className="text-center md:text-left">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusClasses} inline-block mb-3`}>
                  {story.status}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold font-serif text-sukem-text leading-tight mb-2">{story.title}</h1>
              {story.alias && story.alias.length > 0 && <p className="mt-2 text-sm text-sukem-text-muted italic">{Array.isArray(story.alias) ? story.alias.join(' · ') : story.alias}</p>}
            </div>

            {/* Thông tin metadata - CĂN GIỮA HOÀN TOÀN */}
            <div className="grid grid-cols-3 gap-4 border-y border-sukem-border py-4 my-4">
                <div className="text-center">
                    <p className="flex items-center justify-center gap-1 text-xs text-sukem-text-muted uppercase mb-1">
                        <UserIcon className="h-4 w-4 text-sukem-primary"/> Tác giả
                    </p>
                    <p className="font-bold text-sukem-text truncate">{story.author}</p>
                </div>
                <div className="text-center border-l border-sukem-border">
                    <p className="flex items-center justify-center gap-1 text-xs text-sukem-text-muted uppercase mb-1">
                        <EyeIcon className="h-4 w-4 text-blue-500"/> Lượt xem
                    </p>
                    <p className="font-bold text-sukem-text">{story.views.toLocaleString('vi-VN')}</p>
                </div>
                <div className="text-center border-l border-sukem-border">
                    <p className="flex items-center justify-center gap-1 text-xs text-sukem-text-muted uppercase mb-1">
                        <ListBulletIcon className="h-4 w-4 text-green-500"/> Chương
                    </p>
                    <p className="font-bold text-sukem-text">{totalChapters}</p>
                </div>
            </div>

             {/* Đánh giá - ĐÃ CĂN GIỮA */}
            <div className="flex justify-center pb-2">
                <StarRating 
                    rating={story.rating} 
                    count={story.ratingsCount} 
                    userRating={userRating} 
                    onRate={handleRating} 
                />
            </div>

             {/* Tags */}
            {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <TagIcon className="h-5 w-5 text-sukem-text-muted mr-1 flex-shrink-0"/>
                    {story.tags.map(tag => (
                        <span key={tag} className="text-xs font-medium bg-sukem-bg text-sukem-text-muted px-2.5 py-1 rounded border border-sukem-border cursor-default">
                        {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Mô tả: Desktop Scroll | Mobile Collapse */}
            <div className="bg-sukem-bg p-5 rounded-xl border border-sukem-border/50 mt-4">
              <h3 className="font-bold font-serif text-lg mb-2 text-sukem-text">Giới thiệu</h3>
              <div className="relative text-sukem-text leading-relaxed text-sm">
                  <div className={`
                      overflow-hidden 
                      ${!isDescriptionExpanded ? 'line-clamp-4 md:line-clamp-none' : ''} 
                      md:max-h-60 md:overflow-y-auto md:custom-scrollbar md:pr-2
                  `}>
                      {descriptionParagraphs.length > 0 ? (
                          descriptionParagraphs.map((paragraph, index) => (
                              <p key={index} className="mb-2 last:mb-0">{paragraph || '\u00A0'}</p>
                          ))
                      ) : (
                          <p className="italic text-sukem-text-muted">Chưa có mô tả.</p>
                      )}
                  </div>
                  
                  {descriptionNeedsExpansion && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 text-sukem-primary font-bold text-sm flex items-center gap-1 hover:underline md:hidden"
                      >
                          {isDescriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
                          {isDescriptionExpanded
                              ? <ChevronUpIcon className="h-4 w-4" />
                              : <ChevronDownIcon className="h-4 w-4" />
                          }
                      </button>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Phần Nút Bấm MOBILE --- */}
        <div className="md:hidden px-6 pb-6">
          <ActionButtons />
        </div>

        {/* Danh sách chương */}
        <div className="p-6 md:p-10 border-t border-sukem-border bg-sukem-bg/30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold font-serif text-sukem-text whitespace-nowrap flex items-center gap-2">
                <ListBulletIcon className="h-6 w-6 text-sukem-primary"/>
                Danh sách chương
              </h2>
              <div className="relative w-full sm:w-64">
                <input
                    type="text"
                    placeholder="Tìm chương..."
                    value={chapterSearchTerm}
                    onChange={e => setChapterSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-full bg-sukem-bg border-sukem-border focus:ring-2 focus:ring-sukem-accent focus:border-transparent text-sm shadow-sm outline-none text-sukem-text"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-sukem-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
              </div>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredVolumes.length > 0 ? filteredVolumes.map(volume => (
                <div key={volume.id} className="bg-sukem-bg border border-sukem-border rounded-xl overflow-hidden shadow-sm">
                  <h3 className="text-base font-bold font-serif text-sukem-text px-4 py-3 bg-sukem-card border-b border-sukem-border sticky top-0 z-10">
                      {volume.title}
                  </h3>
                  <div className="divide-y divide-sukem-border/50">
                      {volume.chapters && volume.chapters.length > 0 ? volume.chapters.map(chapter => {
                        const isReading = currentBookmark && currentBookmark.chapterId === chapter.id;
                        return (
                          <Link
                              key={chapter.id}
                              to={`/story/${story.id}/chapter/${chapter.id}`}
                              className={`flex justify-between items-center px-4 py-3 transition-colors duration-150 text-sm group ${
                                isReading
                                  ? 'bg-sukem-primary/10 text-sukem-primary font-medium'
                                  : 'text-sukem-text hover:bg-sukem-card'
                              }`}
                          >
                              <div className="flex items-center gap-2 overflow-hidden">
                                {isReading && <BookOpenIcon className="h-4 w-4 flex-shrink-0 text-sukem-primary"/>}
                                <span className="truncate">{chapter.title}</span>
                                {chapter.isRaw && (
                                  <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">RAW</span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-sukem-text-muted">
                                {currentUser?.role === 'admin' && (
                                    <span className="hidden sm:flex items-center gap-1">
                                        <EyeIcon className="h-3.5 w-3.5"/>
                                        {chapter.views?.toLocaleString()}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <CalendarDaysIcon className="h-3.5 w-3.5"/>
                                    {formatDate(chapter.updatedAt || chapter.createdAt)}
                                </span>
                              </div>
                          </Link>
                        );
                      }) : (
                           chapterSearchTerm && <p className="text-sm p-4 text-center text-sukem-text-muted italic">Không tìm thấy chương nào khớp.</p>
                      )}
                  </div>
                </div>
              )) : (
                 <p className="text-center py-10 text-sukem-text-muted italic">
                    {chapterSearchTerm ? 'Không tìm thấy chương nào.' : 'Truyện chưa có chương nào.'}
                 </p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;