// src/pages/StoryDetailPage.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useStories } from '../contexts/StoryContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import StarRating from '../components/StarRating.tsx';
import { Story, Chapter } from '../types.ts';
import {
    PencilIcon, BookOpenIcon, HeartIcon, CalendarDaysIcon, EyeIcon, UserIcon, TagIcon,
    ListBulletIcon, MagnifyingGlassIcon, ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, ArrowRightIcon // Thêm ArrowRightIcon nếu chưa có
} from '@heroicons/react/24/solid';

const StoryDetailPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { getStoryById, addRatingToStory } = useStories();
  const { currentUser } = useAuth();
  const { isFavorite, toggleFavorite, getUserRating, addRating, bookmarks, removeBookmark } = useUserPreferences();

  // States (giữ nguyên)
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chapterSearchTerm, setChapterSearchTerm] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Derived states and memos (giữ nguyên)
  const isUserFavorite = storyId ? isFavorite(storyId) : false;
  const userRating = storyId ? getUserRating(storyId) : undefined;
  const currentBookmark = storyId ? bookmarks[storyId] : null;

  const bookmarkedChapterTitle = useMemo(() => {
      if (!currentBookmark || !story) return null;
      const chapter = story.volumes.flatMap(v => v.chapters).find(c => c.id === currentBookmark.chapterId);
      return chapter?.title || null;
  }, [currentBookmark, story]);

  // Hàm fetch dữ liệu truyện (giữ nguyên)
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

  // Hàm xử lý đánh giá (giữ nguyên)
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

  // Hàm đọc từ đầu (giữ nguyên)
  const handleReadFromBeginning = () => {
     if (storyId) removeBookmark(storyId);
     if (firstChapter && story) navigate(`/story/${story.id}/chapter/${firstChapter.id}`);
  };

  // Lọc danh sách tập/chương theo từ khóa tìm kiếm (giữ nguyên)
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

  // Hàm định dạng ngày (giữ nguyên)
  const formatDate = (isoString: string | undefined) => {
     if (!isoString) return 'N/A';
     try {
         return new Date(isoString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
     } catch (e) { return 'N/A'; }
  };

  // Render states (giữ nguyên)
  if (!storyId) return <Navigate to="/" replace />;
  if (loading) return <div className="flex justify-center items-center h-96"><LoadingSpinner size="lg" /></div>;
  if (error || !story) return <div className="text-center py-20 text-red-500 dark:text-red-400">{error || 'Không thể tải thông tin truyện.'}</div>;

  // Chuẩn bị dữ liệu cho render (giữ nguyên)
  const totalChapters = story.volumes.reduce((acc, vol) => acc + (vol.chapters?.length || 0), 0);
  const statusClasses = story.status === 'Hoàn thành'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/30'
    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 ring-1 ring-inset ring-orange-600/20 dark:ring-orange-500/30';
  const descriptionParagraphs = story.description?.split('\n') || [];
  const descriptionNeedsExpansion = descriptionParagraphs.length > 5;

  // --- START: Component nút bấm riêng biệt ---
  // Component này sẽ chứa logic hiển thị nút cho cả mobile và desktop
  const ActionButtons = () => (
    <>
      {/* --- DESKTOP BUTTONS (Ẩn trên mobile) --- */}
      <div className="hidden md:flex md:flex-col md:gap-3 md:mt-6">
        {/* Nút đọc (tiếp tục hoặc từ đầu) */}
        {currentBookmark ? (
          <>
            <Link
              to={`/story/${story.id}/chapter/${currentBookmark.chapterId}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg shadow-lg hover:shadow-amber-500/40 transition-all duration-300 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 dark:focus:ring-offset-stone-900 text-center"
            >
              <BookOpenIcon className="h-5 w-5 flex-shrink-0"/>
              <span className="truncate">Đọc tiếp: {bookmarkedChapterTitle || 'Chương đã lưu'}</span>
            </Link>
            <button
              onClick={handleReadFromBeginning}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-100 dark:bg-stone-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-stone-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-offset-stone-900"
            >
              <BookOpenIcon className="h-5 w-5"/>
              <span>Đọc từ đầu</span>
            </button>
          </>
        ) : ( firstChapter ? ( // Nếu chưa đọc, hiển thị nút đọc từ đầu (nếu có chương)
          <Link
            to={`/story/${story.id}/chapter/${firstChapter.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg shadow-lg hover:shadow-amber-500/40 transition-all duration-300 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 dark:focus:ring-offset-stone-900">
            <BookOpenIcon className="h-5 w-5"/>
            <span>Đọc từ đầu</span>
          </Link>
        ) : ( // Nếu chưa có chương
          <div className="text-center p-3 bg-slate-100 dark:bg-stone-800 rounded-md text-slate-500 dark:text-stone-400 text-sm italic">Truyện chưa có chương.</div>
        ))}
        {/* Nút yêu thích */}
        {currentUser && (
          <button
            onClick={() => storyId && toggleFavorite(storyId)}
            className={`flex items-center justify-center gap-2 w-full px-4 py-3 font-semibold rounded-lg shadow-sm transition-all duration-300 border focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-stone-900 ${isUserFavorite
                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 focus:ring-red-400'
                : 'bg-white dark:bg-stone-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-stone-600 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 focus:ring-red-400'
              }`}
          >
            <HeartIcon className={`h-5 w-5 transition-colors ${isUserFavorite ? 'text-white' : 'text-slate-400 group-hover:text-red-500'}`}/>
            <span>{isUserFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}</span>
          </button>
        )}
         {/* Nút chỉnh sửa cho Admin */}
        {currentUser?.role === 'admin' && (
          <button onClick={() => navigate(`/admin/story/edit/${story.id}`)} className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-stone-900">
            <PencilIcon className="h-5 w-5" />
            Chỉnh sửa truyện
          </button>
        )}
      </div>

      {/* --- MOBILE BUTTONS (Hiện trên mobile, ẩn trên desktop) --- */}
      <div className="md:hidden mt-6 space-y-3">
        {/* Hàng 1: Đọc tiếp / Đọc từ đầu */}
        <div className="grid grid-cols-2 gap-3">
          {currentBookmark ? (
            <>
              <Link
                to={`/story/${story.id}/chapter/${currentBookmark.chapterId}`}
                className="flex items-center justify-center gap-2 col-span-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg shadow-md hover:shadow-amber-500/30 transition-all duration-300 text-center text-sm"
              >
                <BookOpenIcon className="h-4 w-4 flex-shrink-0"/>
                <span className="truncate">Đọc tiếp</span>
              </Link>
              <button
                onClick={handleReadFromBeginning}
                className="flex items-center justify-center gap-2 col-span-1 px-4 py-2.5 bg-slate-100 dark:bg-stone-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-stone-600 transition text-sm"
              >
                <BookOpenIcon className="h-4 w-4"/>
                <span>Đọc từ đầu</span>
              </button>
            </>
          ) : ( firstChapter ? (
            <Link
              to={`/story/${story.id}/chapter/${firstChapter.id}`}
              className="col-span-2 flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg shadow-lg hover:shadow-amber-500/40 transition-all duration-300 text-sm">
              <BookOpenIcon className="h-5 w-5"/>
              <span>Đọc từ đầu</span>
            </Link>
          ) : (
            <div className="col-span-2 text-center p-3 bg-slate-100 dark:bg-stone-800 rounded-md text-slate-500 dark:text-stone-400 text-sm italic">Truyện chưa có chương.</div>
          ))}
        </div>

        {/* Hàng 2: Yêu thích */}
        {currentUser && (
          <button
            onClick={() => storyId && toggleFavorite(storyId)}
            className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 font-semibold rounded-lg shadow-sm transition-all duration-300 border focus:outline-none text-sm ${isUserFavorite
                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                : 'bg-white dark:bg-stone-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-stone-600 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400'
              }`}
          >
            <HeartIcon className={`h-4 w-4 transition-colors ${isUserFavorite ? 'text-white' : 'text-slate-400 group-hover:text-red-500'}`}/>
            <span>{isUserFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}</span>
          </button>
        )}

        {/* Hàng 3: Chỉnh sửa (Admin) */}
        {currentUser?.role === 'admin' && (
          <button onClick={() => navigate(`/admin/story/edit/${story.id}`)} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-600 text-white font-semibold rounded-lg shadow hover:bg-slate-700 transition-colors text-sm">
            <PencilIcon className="h-4 w-4" />
            Chỉnh sửa truyện
          </button>
        )}
      </div>
    </>
  );
  // --- END: Component nút bấm riêng biệt ---


  // --- RENDER UI ---
  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8 md:space-y-12 pb-8">
      {/* Nút quay lại (giữ nguyên) */}
      <div className="px-4 sm:px-0">
        <Link to="/" className="inline-flex items-center gap-1.5 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-amber-300 text-sm font-medium group transition-colors">
            <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Về trang chủ
        </Link>
      </div>

      {/* Card thông tin truyện */}
      <div className="bg-white dark:bg-stone-900 rounded-lg shadow-xl overflow-hidden mx-4 sm:mx-0 border border-slate-100 dark:border-stone-800">
        {/* Phần thông tin cơ bản */}
        <div className="flex flex-col md:flex-row gap-6 p-4 sm:p-6 md:gap-8 md:p-8">

          {/* Cột trái: Chỉ Ảnh bìa (Di chuyển nút ra ngoài) */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <img className="h-auto w-full rounded-lg shadow-lg aspect-[2/3] object-cover border border-slate-200 dark:border-stone-700" src={story.coverImage} alt={`Bìa truyện ${story.title}`} />
            {/* --- Chỉ hiển thị nút desktop ở đây --- */}
            <div className="hidden md:block">
              <ActionButtons />
            </div>
          </div>

          {/* Cột phải: Thông tin chi tiết (giữ nguyên cấu trúc bên trong) */}
          <div className="w-full md:w-2/3 space-y-6">
            {/* Tên truyện, trạng thái, tên khác */}
            <div>
              <span className={`text-xs sm:text-sm font-semibold px-3 py-1 rounded-full ${statusClasses} inline-block mb-3`}>
                  {story.status}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-white leading-tight">{story.title}</h1>
              {story.alias && story.alias.length > 0 && <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 italic">{Array.isArray(story.alias) ? story.alias.join(' · ') : story.alias}</p>}
            </div>

            {/* Thông tin metadata - ĐÃ CẬP NHẬT RESPONSIVE */}
            <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3 text-sm border-t border-b border-slate-100 dark:border-stone-800 py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:justify-start sm:gap-x-4 sm:gap-y-3"> {/* Áp dụng flex cho mobile, grid cho sm trở lên */}
                {/* Tác giả */}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <UserIcon className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0"/>
                    <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Tác giả</div>
                        <div className="font-medium">{story.author}</div>
                    </div>
                </div>
                {/* Lượt xem */}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <EyeIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0"/>
                    <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Lượt xem</div>
                        <div className="font-medium">{story.views.toLocaleString('vi-VN')}</div>
                    </div>
                </div>
                {/* Số chương */}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <ListBulletIcon className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0"/>
                    <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Số chương</div>
                        <div className="font-medium">{totalChapters}</div>
                    </div>
                </div>
            </div>

             {/* Đánh giá */}
            <div><StarRating rating={story.rating} count={story.ratingsCount} userRating={userRating} onRate={handleRating} /></div>

             {/* Tags */}
            {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-0">
                    <TagIcon className="h-5 w-5 text-slate-400 dark:text-stone-500 mr-1 flex-shrink-0"/>
                    {story.tags.map(tag => (
                        <span key={tag} className="text-xs font-medium bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-stone-700 hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors cursor-default">
                        {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Mô tả với giới hạn dòng/cuộn */}
            <div className="pt-2">
              <h2 className="text-xl font-semibold mb-3 font-serif text-slate-800 dark:text-slate-100">Mô tả</h2>
              {/* Container cho mô tả */}
              <div className="relative text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base space-y-3">
                  <div className={`
                        overflow-hidden
                        ${!isDescriptionExpanded ? 'line-clamp-5' : ''}
                        md:line-clamp-none
                        md:max-h-87
                        md:overflow-y-auto
                        md:pr-3
                        md:custom-scrollbar
                    `}>
                      {descriptionParagraphs.length > 0 ? (
                          descriptionParagraphs.map((paragraph, index) => (
                              <p key={index}>{paragraph || '\u00A0'}</p>
                          ))
                      ) : (
                          <p className="italic text-slate-500">Chưa có mô tả.</p>
                      )}
                  </div>
                  {/* Nút Xem thêm/Thu gọn (chỉ hiện khi cần và trên mobile) */}
                  {descriptionNeedsExpansion && (
                       <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="md:hidden mt-2 text-orange-600 dark:text-amber-400 hover:underline text-sm font-medium flex items-center gap-1"
                          aria-expanded={isDescriptionExpanded}
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

        {/* --- Phần Nút Bấm MOBILE (Hiện trên mobile, ẩn trên desktop) --- */}
        {/* Di chuyển phần nút mobile xuống đây, bên ngoài flex container chính */}
        <div className="md:hidden px-4 pb-6 border-t border-slate-200 dark:border-stone-800 pt-6 bg-slate-50/50 dark:bg-stone-950/50">
          <ActionButtons />
        </div>

        {/* Danh sách chương (giữ nguyên cấu trúc) */}
        <div className="p-4 sm:p-6 md:p-8 border-t border-slate-200 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-950/50">
          {/* Header và ô tìm kiếm chương */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
              <h2 className="text-xl font-semibold font-serif text-slate-800 dark:text-slate-100 whitespace-nowrap">
                <ListBulletIcon className="h-6 w-6 inline-block mr-2 text-orange-500 align-text-bottom"/>
                Danh sách chương ({totalChapters})
              </h2>
              <div className="relative w-full sm:w-64">
                <input
                    type="text"
                    placeholder="Tìm chương hoặc tên tập..."
                    value={chapterSearchTerm}
                    onChange={e => setChapterSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-full bg-white dark:bg-stone-800 border-slate-300 dark:border-stone-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm shadow-sm"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
              </div>
          </div>
          {/* Danh sách tập/chương */}
          <div className="space-y-4 max-h-[45rem] overflow-y-auto pr-3 -mr-1 custom-scrollbar">
              {filteredVolumes.length > 0 ? filteredVolumes.map(volume => (
                <div key={volume.id} className="bg-white dark:bg-stone-800/50 border border-slate-200 dark:border-stone-700/50 rounded-lg overflow-hidden shadow-sm">
                  {/* Tên tập */}
                  <h3 className="text-base font-semibold font-serif text-slate-900 dark:text-slate-100 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-stone-800 dark:to-stone-800/70 border-b border-slate-200 dark:border-stone-700 sticky top-0 z-10 backdrop-blur-sm">
                      {volume.title}
                  </h3>
                  {/* Danh sách chương */}
                  <div>
                      {volume.chapters && volume.chapters.length > 0 ? volume.chapters.map(chapter => {
                        const isReading = currentBookmark && currentBookmark.chapterId === chapter.id;
                        return (
                          <Link
                              key={chapter.id}
                              to={`/story/${story.id}/chapter/${chapter.id}`}
                              className={`block p-3 transition-colors duration-150 text-sm group border-t border-slate-100 dark:border-stone-700/50 first:border-t-0 ${
                                isReading
                                  ? 'bg-orange-100 dark:bg-amber-900/60 font-medium'
                                  : 'hover:bg-orange-50/70 dark:hover:bg-stone-700/50'
                              }`}
                          >
                              <div className="flex justify-between items-center gap-4">
                                {/* Tên chương + icon đang đọc */}
                                <div className="flex items-center gap-2 min-w-0">
                                  {isReading && <BookOpenIcon className="h-4 w-4 text-orange-600 dark:text-amber-400 flex-shrink-0"/>}
                                  <span className={`flex-grow text-slate-700 dark:text-slate-200 truncate group-hover:text-orange-800 dark:group-hover:text-amber-200 ${isReading ? '' : 'pl-6'}`}>
                                      {chapter.title}
                                  </span>
                                  {/* Tag RAW */}
                                  {chapter.isRaw && (
                                    <span className="ml-2 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 rounded-full ring-1 ring-inset ring-amber-600/10 dark:ring-amber-400/20">
                                      RAW
                                    </span>
                                  )}
                                </div>
                                {/* Ngày đăng + Lượt xem (admin) */}
                                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500 dark:text-stone-400">
                                  {currentUser?.role === 'admin' && (
                                    <span className="hidden sm:flex items-center gap-1" title="Lượt xem (admin)">
                                        <EyeIcon className="h-3.5 w-3.5"/>
                                        {chapter.views?.toLocaleString('vi-VN') || 0}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                      <CalendarDaysIcon className="h-3.5 w-3.5"/>
                                      {formatDate(chapter.createdAt)}
                                  </span>
                                </div>
                          </div>
                      </Link>
                        );
                      }) : (
                           chapterSearchTerm && <p className="text-sm p-4 text-center text-slate-500 dark:text-stone-500 italic">Không tìm thấy chương nào khớp trong tập "{volume.title}".</p>
                      )}
                  </div>
                </div>
              )) : (
                 <p className="text-center py-10 text-slate-500 dark:text-stone-400 italic">
                    {chapterSearchTerm ? 'Không tìm thấy chương hoặc tập nào khớp với tìm kiếm.' : 'Truyện chưa có chương nào.'}
                 </p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;
