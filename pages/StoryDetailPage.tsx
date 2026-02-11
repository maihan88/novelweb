import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useStories } from '../contexts/StoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StarRating from '../components/StarRating';
import { Story, Chapter } from '../types';
import {
    BookOpenIcon, HeartIcon, EyeIcon, UserIcon,
    ListBulletIcon, MagnifyingGlassIcon, HomeIcon,
    PencilSquareIcon, ChevronLeftIcon, ChevronRightIcon,
    InformationCircleIcon, ClockIcon 
} from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDate } from '../utils/formatDate';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const ITEMS_PER_PAGE = 50;

interface ChapterWithVolume extends Chapter {
    volumeTitle: string;
    volumeId: string;
}

const StoryDetailPage: React.FC = () => {
    const { storyId } = useParams<{ storyId: string }>();
    const navigate = useNavigate();
    const { getStoryById, addRatingToStory } = useStories();
    const { currentUser } = useAuth();
    const { isFavorite, toggleFavorite, getUserRating, addRating, bookmarks, removeBookmark } = useUserPreferences();

    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [chapterSearchTerm, setChapterSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const isUserFavorite = storyId ? isFavorite(storyId) : false;
    const userRating = storyId ? getUserRating(storyId) : undefined;
    const currentBookmark = storyId ? bookmarks[storyId] : null;

    const fetchStory = useCallback(async () => {
        if (!storyId) return;
        setLoading(true);
        try {
            const fetchedStory = await getStoryById(storyId);
            setStory(fetchedStory || null);
            if (!fetchedStory) setError('Không tìm thấy truyện này.');
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi khi tải truyện.');
        } finally {
            setLoading(false);
        }
    }, [storyId, getStoryById]);

    useEffect(() => {
        fetchStory();
        window.scrollTo(0, 0);
    }, [fetchStory]);

    useEffect(() => {
        setCurrentPage(1);
    }, [chapterSearchTerm]);

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

    const allChaptersFlat = useMemo<ChapterWithVolume[]>(() => {
        if (!story) return [];
        return story.volumes.flatMap(vol => 
            vol.chapters.map(chap => ({
                ...chap,
                volumeTitle: vol.title,
                volumeId: vol.id
            }))
        );
    }, [story]);

    const { paginatedData, totalPages, totalChaptersCount } = useMemo(() => {
        if (!story) return { paginatedData: [], totalPages: 0, totalChaptersCount: 0 };

        let filtered = allChaptersFlat;
        
        if (chapterSearchTerm.trim()) {
            const lowerSearchTerm = chapterSearchTerm.toLowerCase();
            filtered = allChaptersFlat.filter(c => c.title.toLowerCase().includes(lowerSearchTerm));
        }

        const total = filtered.length;
        const totalP = Math.ceil(total / ITEMS_PER_PAGE);
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        
        const slice = filtered.slice(start, end);

        const groupedSlice: { volumeTitle: string; chapters: ChapterWithVolume[] }[] = [];
        
        slice.forEach(chapter => {
            const lastGroup = groupedSlice[groupedSlice.length - 1];
            if (lastGroup && lastGroup.volumeTitle === chapter.volumeTitle) {
                lastGroup.chapters.push(chapter);
            } else {
                groupedSlice.push({ volumeTitle: chapter.volumeTitle, chapters: [chapter] });
            }
        });

        return { paginatedData: groupedSlice, totalPages: totalP, totalChaptersCount: total };
    }, [story, allChaptersFlat, chapterSearchTerm, currentPage]);

    const firstChapter = allChaptersFlat.length > 0 ? allChaptersFlat[0] : null;

    const handleReadFromBeginning = () => {
        if (storyId) removeBookmark(storyId);
        if (firstChapter && story) navigate(`/story/${story.id}/chapter/${firstChapter.id}`);
    };

    if (!storyId) return <Navigate to="/" replace />;
    if (loading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
    if (error || !story) return <div className="text-center py-20 text-sukem-text-muted">{error || 'Không thể tải thông tin truyện.'}</div>;

    const statusClasses = story.status === 'Hoàn thành'
        ? 'bg-green-100 text-green-700 border-green-200'
        : 'bg-sukem-primary/10 text-sukem-primary border-sukem-primary/20';

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-12 px-4 sm:px-6">
            <nav className="flex items-center text-sm text-sukem-text-muted mb-6 overflow-x-auto whitespace-nowrap px-1">
                <Link to="/" className="hover:text-sukem-primary flex items-center gap-1 transition-colors">
                    <HomeIcon className="w-4 h-4" /> Trang chủ
                </Link>
                <span className="mx-2 text-sukem-border">/</span>
                <span className="font-medium text-sukem-text truncate max-w-[200px] sm:max-w-md">{story.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-stretch relative">
                
                {/* 1. CARD THÔNG TIN TRUYỆN */}
                <div className="lg:col-span-8">
                    <div className="bg-sukem-card rounded-2xl shadow-sm border border-sukem-border p-5 md:p-6 h-full">
                        <div className="flex flex-col sm:flex-row items-start gap-6 md:gap-8 h-full">
                            <div className="w-48 sm:w-56 md:w-64 flex-shrink-0 mx-auto sm:mx-0 shadow-md rounded-xl overflow-hidden border border-sukem-border relative group">
                                <div className="aspect-[2/3] w-full relative">
                                    <img 
                                        src={story.coverImage} 
                                        className="absolute inset-0 w-full h-full object-cover" 
                                        alt={story.title} 
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col h-full self-stretch">
                                <div className="flex flex-wrap items-center gap-2 mb-2 justify-center sm:justify-start">
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", statusClasses)}>{story.status}</span>
                                    {story.isHot && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">HOT</span>}
                                </div>

                                <h1 className="text-2xl md:text-3xl font-bold font-serif text-sukem-text leading-tight text-center sm:text-left mb-1">{story.title}</h1>
                                
                                {story.alias && story.alias.length > 0 && (
                                    <p className="text-sm text-sukem-text-muted italic text-center sm:text-left mb-3">
                                        <span className="font-semibold not-italic text-sukem-text">Tên khác: </span> 
                                        {Array.isArray(story.alias) ? story.alias.join(' · ') : story.alias}
                                    </p>
                                )}

                                {/* --- STATS SECTION --- */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-2 text-sukem-text-muted text-sm mb-4">
                                    <span className="flex items-center gap-1"><UserIcon className="w-4 h-4 text-sukem-primary"/> {story.author}</span>
                                    <span className="hidden sm:inline text-sukem-border">|</span>
                                    <span className="flex items-center gap-1"><ListBulletIcon className="w-4 h-4 text-green-500"/> {allChaptersFlat.length} chương</span>
                                    <span className="hidden sm:inline text-sukem-border">|</span>
                                    <span className="flex items-center gap-1"><EyeIcon className="w-4 h-4 text-blue-500"/> {story.views.toLocaleString()} lượt xem</span>
                                    <span className="hidden sm:inline text-sukem-border">|</span>
                                    <span className="flex items-center gap-1" title="Cập nhật lần cuối">
                                        <ClockIcon className="w-4 h-4 text-orange-500"/> 
                                        {formatDate(story.lastUpdatedAt)}
                                    </span>
                                </div>

                                {/* Tags */}
                                {story.tags && (
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                                        {story.tags.map(tag => (
                                            <span key={tag} className="text-xs px-2 py-1 rounded-md bg-sukem-bg border border-sukem-border text-sukem-text hover:text-sukem-primary cursor-pointer transition-colors">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Rating */}
                                <div className="mt-auto bg-sukem-bg/50 rounded-xl p-3 border border-sukem-border">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center leading-none">
                                                <span className="text-2xl font-bold text-sukem-text">{story.rating.toFixed(1)}</span>
                                                <span className="text-[10px] text-sukem-text-muted">{story.ratingsCount} đánh giá</span>
                                            </div>
                                            <div className="h-8 w-px bg-sukem-border"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-sukem-text-muted">Đánh giá</span>
                                                <StarRating rating={story.rating} count={0} userRating={userRating} onRate={handleRating}/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2 mt-4">
                                    {currentBookmark ? (
                                        <>
                                            <Link to={`/story/${story.id}/chapter/${currentBookmark.chapterId}`} className="flex-1 btn-primary py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-white bg-gradient-to-r from-sukem-primary to-sukem-accent shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                                <BookOpenIcon className="w-5 h-5"/> Đọc tiếp
                                            </Link>
                                            <button onClick={handleReadFromBeginning} className="px-4 py-2.5 rounded-lg border border-sukem-border font-semibold text-sukem-text hover:bg-sukem-bg transition-colors">
                                                Đọc lại
                                            </button>
                                        </>
                                    ) : (
                                        <Link to={firstChapter ? `/story/${story.id}/chapter/${firstChapter.id}` : '#'} className={cn("flex-1 btn-primary py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-white bg-gradient-to-r from-sukem-primary to-sukem-accent shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all", !firstChapter && "opacity-50 cursor-not-allowed")}>
                                            <BookOpenIcon className="w-5 h-5"/> Đọc ngay
                                        </Link>
                                    )}
                                    {currentUser && (
                                        <button onClick={() => toggleFavorite(story.id)} className={cn("px-3 rounded-lg border flex items-center justify-center transition-colors", isUserFavorite ? "border-red-200 bg-red-50 text-red-500" : "border-sukem-border text-sukem-text hover:text-red-500")}>
                                            <HeartIcon className={cn("w-6 h-6", isUserFavorite ? "fill-current" : "")}/>
                                        </button>
                                    )}
                                    {currentUser?.role === 'admin' && (
                                        <button onClick={() => navigate(`/admin/story/edit/${story.id}`)} className="px-3 rounded-lg border border-sukem-border text-sukem-text hover:bg-sukem-bg">
                                            <PencilSquareIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CARD MÔ TẢ (Chiếm 4/12) */}
                <div className="lg:col-span-4 relative">
                    <div className="bg-sukem-card rounded-2xl shadow-sm border border-sukem-border flex flex-col overflow-hidden max-h-[350px] lg:max-h-none lg:absolute lg:inset-0 lg:h-full">
                        <div className="p-3 border-b border-sukem-border bg-sukem-bg/30 font-bold text-sukem-text flex items-center gap-2 shrink-0">
                             <InformationCircleIcon className="w-5 h-5 text-sukem-primary"/>
                             Mô tả
                        </div>
                        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                            <div className="text-sukem-text leading-loose text-justify text-sm whitespace-pre-wrap">
                                {story.description ? story.description : <span className="block text-center italic text-sukem-text-muted">Đang cập nhật...</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM SECTION: CHAPTER LIST --- */}
            <div className="bg-sukem-card rounded-2xl border border-sukem-border shadow-sm overflow-hidden" id="chapter-list">
                <div className="p-4 border-b border-sukem-border bg-sukem-bg/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-sukem-text text-lg flex items-center gap-2">
                        <ListBulletIcon className="w-6 h-6 text-sukem-primary"/> 
                        Danh sách chương 
                        <span className="text-sm font-normal text-sukem-text-muted">({totalChaptersCount} chương)</span>
                    </h3>
                    
                    <div className="relative w-full sm:w-64">
                        <input 
                            type="text" 
                            placeholder="Tìm số chương, tên chương..." 
                            value={chapterSearchTerm} 
                            onChange={e => setChapterSearchTerm(e.target.value)} 
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-sukem-border bg-sukem-bg focus:ring-1 focus:ring-sukem-primary outline-none text-sm text-sukem-text transition-all" 
                        />
                        <MagnifyingGlassIcon className="h-4 w-4 text-sukem-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                    </div>
                </div>

                <div className="p-5">
                    {paginatedData.length > 0 ? (
                        <div className="space-y-6">
                            {paginatedData.map((group, index) => (
                                <div key={`${group.volumeTitle}-${index}`} className="animate-fade-in">
                                    <div className="flex items-center gap-3 mb-4 mt-2">
                                        <div className="h-8 w-1.5 bg-sukem-primary rounded-full shadow-sm"></div>
                                        <div className="flex-1">
                                            <h4 className="text-base font-bold text-sukem-text uppercase tracking-wide flex items-center gap-2">
                                                <BookOpenIcon className="w-5 h-5 text-sukem-primary"/>
                                                {group.volumeTitle}
                                            </h4>
                                            <div className="h-px w-full bg-gradient-to-r from-sukem-primary/30 to-transparent mt-1"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {group.chapters.map(chapter => {
                                            const isReading = currentBookmark?.chapterId === chapter.id;
                                            return (
                                                <Link 
                                                    key={chapter.id} 
                                                    to={`/story/${story.id}/chapter/${chapter.id}`} 
                                                    className={cn(
                                                        "flex items-center justify-between gap-3 p-3 rounded-lg text-sm transition-all border group",
                                                        isReading 
                                                            ? "bg-sukem-primary/10 border-sukem-primary/40 text-sukem-primary font-medium shadow-sm" 
                                                            : "bg-sukem-bg/30 border-transparent hover:bg-sukem-bg hover:border-sukem-border text-sukem-text shadow-sm hover:shadow-md"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="truncate group-hover:text-sukem-primary transition-colors">{chapter.title}</span>
                                                        {chapter.isRaw && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full flex-shrink-0">RAW</span>}
                                                        {isReading && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-sukem-primary text-white rounded-full flex-shrink-0">Đang đọc</span>}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1 text-[10px] text-sukem-text-muted whitespace-nowrap flex-shrink-0 group-hover:text-sukem-primary/70 transition-colors">
                                                        <div className="h-3 w-3"/>
                                                        {formatDate(chapter.updatedAt || chapter.createdAt)}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-sukem-border border-dashed">
                                    <button 
                                        onClick={() => {
                                            setCurrentPage(prev => Math.max(prev - 1, 1));
                                            document.getElementById('chapter-list')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-sukem-border bg-sukem-bg hover:bg-sukem-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeftIcon className="w-5 h-5 text-sukem-text"/>
                                    </button>
                                    
                                    <span className="text-sm font-medium text-sukem-text px-4">
                                        Trang {currentPage} / {totalPages}
                                    </span>

                                    <button 
                                        onClick={() => {
                                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                            document.getElementById('chapter-list')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-sukem-border bg-sukem-bg hover:bg-sukem-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRightIcon className="w-5 h-5 text-sukem-text"/>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-sukem-text-muted italic flex flex-col items-center">
                            <BookOpenIcon className="w-12 h-12 mb-2 text-sukem-border"/>
                            Không tìm thấy chương nào phù hợp.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoryDetailPage;