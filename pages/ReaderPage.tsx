// file: pages/ReaderPage.tsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Story, Chapter, ReaderPreferences, ReaderTheme } from '../types';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import ReaderControls from '../components/ReaderControls.tsx';
import CommentSection from '../components/CommentSection.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import {
    ArrowLeftIcon, ArrowRightIcon,
    HomeIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useLocalStorage } from '../hooks/useLocalStorage.tsx';

// --- ReadingProgressBar (Không đổi) ---
const ReadingProgressBar: React.FC<{ progress: number }> = React.memo(({ progress }) => {
    // ... (giữ nguyên code)
    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 z-[60]">
            <div
                className="h-1 bg-orange-600 dark:bg-amber-400 origin-left"
                style={{
                    transform: `scaleX(${progress / 100})`,
                    transition: 'transform 200ms ease-out',
                    willChange: 'transform'
                }}
            />
        </div>
    );
});
ReadingProgressBar.displayName = 'ReadingProgressBar';

// --- FloatingNavBar (Không đổi) ---
const FloatingNavBar: React.FC<{
    story: Story;
    currentChapterId: string;
    prevChapter?: Chapter | null;
    nextChapter?: Chapter | null;
    isVisible: boolean;
}> = ({ story, currentChapterId, prevChapter, nextChapter, isVisible }) => {
    // ... (giữ nguyên code)
    const navigate = useNavigate();

    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newChapterId = e.target.value;
        if (newChapterId) navigate(`/story/${story.id}/chapter/${newChapterId}`);
    };

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
    };

    const navButtonClasses = `p-2.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-opacity-50`;
    const disabledClasses = "opacity-40 cursor-not-allowed pointer-events-none";

    return (
        <div className={`fixed top-0 left-0 w-full p-2 z-50 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="container mx-auto max-w-3xl flex items-center gap-2 text-white bg-black/60 backdrop-blur-md p-2 rounded-xl shadow-lg border border-white/10">
                <Link
                    to={`/story/${story.id}`}
                    className={navButtonClasses}
                    aria-label="Về trang truyện"
                    onClick={handleNavigation}
                >
                    <HomeIcon className="h-5 w-5" />
                </Link>
                <Link
                    to={prevChapter ? `/story/${story.id}/chapter/${prevChapter.id}` : '#'}
                    className={`${navButtonClasses} ${!prevChapter ? disabledClasses : ''}`}
                    aria-disabled={!prevChapter}
                    aria-label="Chương trước"
                    onClick={handleNavigation}
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <select
                    value={currentChapterId}
                    onChange={handleChapterSelect}
                    className="w-full flex-grow px-3 py-2 border-0 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-opacity-50 transition appearance-none text-center text-sm cursor-pointer hover:bg-white/20"
                    aria-label="Chọn chương"
                >
                    {story.volumes.map(volume => (
                        <optgroup label={volume.title} key={volume.id} className="bg-stone-800 text-stone-200 font-semibold">
                            {volume.chapters.map(chap => (
                                <option key={chap.id} value={chap.id} className="font-normal">{chap.title}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <Link
                    to={nextChapter ? `/story/${story.id}/chapter/${nextChapter.id}` : '#'}
                    className={`${navButtonClasses} ${!nextChapter ? disabledClasses : ''}`}
                    aria-disabled={!nextChapter}
                    aria-label="Chương sau"
                    onClick={handleNavigation}
                >
                    <ArrowRightIcon className="h-5 w-5" />
                </Link>
            </div>
        </div>
    );
};

// --- Mapping theme sang class Tailwind (Không đổi) ---
const themeClasses: Record<ReaderTheme, string> = {
    light: 'bg-white text-slate-800',
    sepia: 'bg-[#fbf0d9] text-[#5f4b32]',
    dark: 'bg-stone-900 text-stone-200'
};

// --- CẬP NHẬT: Mapping margin sang class PADDING và MAX-WIDTH ---
const marginSettings: Record<number, { padding: string; maxWidth: string }> = {
    0:  { padding: 'px-1 sm:px-2',   maxWidth: 'max-w-none' },    // Lề nhỏ nhất, gần full màn hình
    5:  { padding: 'px-3 sm:px-4',   maxWidth: 'max-w-4xl' },    // Lề nhỏ
    10: { padding: 'px-4 sm:px-6',   maxWidth: 'max-w-3xl' },    // Lề mặc định
    15: { padding: 'px-6 sm:px-10',  maxWidth: 'max-w-2xl' },    // Lề vừa
    20: { padding: 'px-8 sm:px-14',  maxWidth: 'max-w-xl' }     // Lề lớn nhất
};
// --- KẾT THÚC CẬP NHẬT ---


const ReaderPage: React.FC = () => {
    const { storyId, chapterId } = useParams<{ storyId: string, chapterId: string }>();
    const navigate = useNavigate();
    const { getStoryById, incrementChapterView } = useStories();
    const { bookmarks, updateBookmark } = useUserPreferences();
    const { currentUser } = useAuth();

    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);

    const [preferences, setPreferences] = useLocalStorage<ReaderPreferences>('readerPreferences', {
        fontSize: 18,
        fontFamily: 'font-reader-lora',
        lineHeight: 1.7,
        margin: 10,
        theme: 'light',
    });

    const [scrollPercent, setScrollPercent] = useState(0);
    const progressRef = useRef(0);
    const viewIncrementedRef = useRef(false);
    const readerContentRef = useRef<HTMLDivElement>(null);
    const [isFloatingNavVisible, setIsFloatingNavVisible] = useState(false);
    const lastTap = useRef(0);

    const updateBookmarkRef = useRef(updateBookmark);
    useEffect(() => {
        updateBookmarkRef.current = updateBookmark;
    });

    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);

    // Các useEffect khác (Không đổi)
    useEffect(() => {
        if (!storyId) return;
        setLoading(true);
        getStoryById(storyId).then(fetchedStory => {
            setStory(fetchedStory || null);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [storyId, getStoryById]);

    useEffect(() => {
        viewIncrementedRef.current = false;
        window.scrollTo(0, 0);
        const savedBookmark = storyId ? bookmarks[storyId] : null;
        if (savedBookmark && savedBookmark.chapterId === chapterId) {
             requestAnimationFrame(() => {
                 setTimeout(() => {
                    if (readerContentRef.current) {
                        const contentTop = readerContentRef.current.offsetTop;
                        const contentHeight = readerContentRef.current.scrollHeight;
                        const viewportHeight = window.innerHeight;
                        if (contentHeight > viewportHeight) {
                            const maxScrollInContent = contentHeight - viewportHeight;
                            const targetScrollInContent = (maxScrollInContent * savedBookmark.progress) / 100;
                            const targetScrollPosition = contentTop + targetScrollInContent;
                            window.scrollTo({ top: targetScrollPosition, behavior: 'auto' });
                             progressRef.current = savedBookmark.progress;
                             setScrollPercent(savedBookmark.progress);
                        } else {
                            progressRef.current = 100;
                            setScrollPercent(100);
                        }
                    }
                 }, 50);
            });
        } else {
             progressRef.current = 0;
             setScrollPercent(0);
        }
    }, [storyId, chapterId, bookmarks]);

    useEffect(() => {
        if (!story || !storyId || !chapterId) return;
        if (!viewIncrementedRef.current && !isAdmin) {
            incrementChapterView(storyId, chapterId);
            viewIncrementedRef.current = true;
        }
        const preventAction = (e: Event) => e.preventDefault();
        const contentEl = readerContentRef.current;
        if (contentEl) {
            contentEl.addEventListener('contextmenu', preventAction);
            contentEl.addEventListener('copy', preventAction);
        }
        const handleScroll = () => {
            const contentElement = readerContentRef.current;
            if (!contentElement) return;
            const contentTop = contentElement.offsetTop;
            const contentHeight = contentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const currentScrollTop = window.pageYOffset;
            let percentage = 0;
            if (contentHeight <= viewportHeight) {
                percentage = 100;
            } else {
                 const scrollStartInContent = Math.max(0, currentScrollTop - contentTop);
                 const maxScrollInContent = contentHeight - viewportHeight;
                 percentage = maxScrollInContent > 0 ? Math.min(100, (scrollStartInContent / maxScrollInContent) * 100) : 100;
            }
            progressRef.current = percentage;
            setScrollPercent(percentage);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
         handleScroll();
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (contentEl) {
                contentEl.removeEventListener('contextmenu', preventAction);
                contentEl.removeEventListener('copy', preventAction);
            }
            if (storyId && chapterId) {
                 const finalProgress = Math.round(progressRef.current >= 99 ? 100 : progressRef.current);
                updateBookmarkRef.current(storyId, chapterId, finalProgress);
            }
        };
    }, [story, storyId, chapterId, isAdmin, incrementChapterView]);


    // handleTapZoneClick (Không đổi)
    const handleTapZoneClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (window.getSelection()?.toString() || (event.target as HTMLElement).closest('a, button, select, [data-control-button]')) {
            return;
        }
        const now = Date.now();
        if (now - lastTap.current < 350) {
            setIsFloatingNavVisible(p => !p);
        }
        lastTap.current = now;
    };

    // useMemo chapter, prev/next (Không đổi)
    const { chapter, prevChapter, nextChapter } = useMemo(() => {
        if (!story || !chapterId) return { chapter: undefined, prevChapter: null, nextChapter: null };
        const allChapters = story.volumes.flatMap(v => v.chapters);
        const index = allChapters.findIndex(c => c.id === chapterId);
        if (index === -1) return { chapter: undefined, prevChapter: null, nextChapter: null };
        return {
            chapter: allChapters[index],
            prevChapter: index > 0 ? allChapters[index - 1] : null,
            nextChapter: index < allChapters.length - 1 ? allChapters[index + 1] : null,
        };
    }, [story, chapterId]);


     // cleanedContent (Không đổi)
     const cleanedContent = useMemo(() => {
        if (!chapter?.content) return '';
        return chapter.content.replace(/line-height:[^;"]*;/g, '');
    }, [chapter?.content]);

    // contentStyle (Không đổi)
    const contentStyle = useMemo(() => ({
        fontSize: `${preferences.fontSize}px`,
        lineHeight: preferences.lineHeight
    }), [preferences.fontSize, preferences.lineHeight]);


    // navButton styles (Không đổi)
    const navButtonBaseClasses = "flex items-center justify-center gap-2 px-4 py-2 border rounded-md transition-colors duration-200 text-sm font-medium";
    // ... (rest of nav button styles are unchanged)
    const navButtonEnabledClasses = "border-orange-300 dark:border-stone-600 text-slate-700 dark:text-stone-300 hover:bg-orange-50 dark:hover:bg-stone-700";
    const navButtonDisabledClasses = "border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-400 dark:text-stone-500 cursor-not-allowed";


    // handleChapterSelect, handleNavClick (Không đổi)
    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newChapterId = e.target.value;
        if (newChapterId) navigate(`/story/${storyId}/chapter/${newChapterId}`);
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {};

    // Loading/Error states (Không đổi)
    if (loading) return <div className="flex justify-center items-center h-screen bg-white dark:bg-stone-950"><LoadingSpinner /></div>;
    if (!story || !chapter) return <div className="flex justify-center items-center h-screen bg-white dark:bg-stone-950 text-red-500">Không tìm thấy truyện hoặc chương.</div>;

    // --- Lấy class cho theme và margin/padding ---
    const currentThemeClass = themeClasses[preferences.theme] || themeClasses.light;
    // Đảm bảo margin có giá trị hợp lệ, nếu không thì dùng mặc định (10)
    const currentMarginSetting = marginSettings[preferences.margin] || marginSettings[10];
    const contentContainerClasses = `mx-auto animate-fade-in py-16 sm:py-20 min-h-screen ${currentMarginSetting.padding} ${currentMarginSetting.maxWidth}`;
    // --- KẾT THÚC ---


    return (
        // --- ÁP DỤNG THEME CLASS ---
        <div className={`min-h-full transition-colors duration-300 ${currentThemeClass}`}>
            <ReadingProgressBar progress={scrollPercent} />
            <FloatingNavBar
                story={story}
                currentChapterId={chapterId!}
                prevChapter={prevChapter}
                nextChapter={nextChapter}
                isVisible={isFloatingNavVisible}
            />
            {/* --- ÁP DỤNG PADDING VÀ MAX-WIDTH CLASS --- */}
            <div onClick={handleTapZoneClick} className={contentContainerClasses}>
                {/* Header chương */}
                <div className={`text-center mb-10 ${preferences.theme === 'sepia' ? 'text-[#5f4b32]' : 'text-slate-900 dark:text-white'}`}>
                    <Link
                        to={`/story/${story.id}`}
                        className={`${preferences.theme === 'sepia' ? 'text-[#8c6d46]' : 'text-orange-600 dark:text-amber-400'} hover:underline text-sm sm:text-base`}
                    >
                         {story.title}
                     </Link>
                    <h1 className={`text-3xl sm:text-4xl font-bold font-serif mt-2 leading-tight`}>
                        {chapter.title}
                    </h1>
                </div>

                {/* Nội dung truyện */}
                <div
                    ref={readerContentRef}
                    className={`max-w-none transition-all duration-300 ${preferences.fontFamily} chapter-content prevent-copy ${
                        preferences.theme === 'light' ? 'text-slate-800' :
                        preferences.theme === 'sepia' ? 'text-[#5f4b32]' :
                        'text-stone-200'
                    }`}
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: cleanedContent }}
                />

                {/* Navigation cuối chương (Không đổi) */}
                <div className={`mt-12 pt-8 border-t ${preferences.theme === 'sepia' ? 'border-[#dcd3c1]' : 'border-slate-200 dark:border-stone-700'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                        {/* Prev Button */}
                        {prevChapter ? (
                             <Link
                                to={`/story/${story.id}/chapter/${prevChapter.id}`}
                                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-md transition-colors duration-200 text-sm font-medium ${
                                    preferences.theme === 'light' ? 'border-orange-300 text-slate-700 hover:bg-orange-50' :
                                    preferences.theme === 'sepia' ? 'border-[#c8b79a] text-[#5f4b32] hover:bg-[#f5e9d3]' :
                                    'border-stone-600 text-stone-300 hover:bg-stone-700'
                                }`}
                                onClick={handleNavClick}
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                <span>Chương trước</span>
                            </Link>
                        ) : (
                             <div className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-sm font-medium cursor-not-allowed ${
                                 preferences.theme === 'light' ? 'border-slate-200 bg-slate-50 text-slate-400' :
                                 preferences.theme === 'sepia' ? 'border-[#dcd3c1] bg-[#f5e9d3]/50 text-[#a0927c]' :
                                 'border-stone-700 bg-stone-800 text-stone-500'
                             }`}>
                                <ArrowLeftIcon className="h-4 w-4" />
                                <span>Chương trước</span>
                            </div>
                        )}
                        {/* Chapter Select */}
                        <select
                            value={chapterId}
                            onChange={handleChapterSelect}
                            className={`w-full sm:w-auto flex-grow px-3 py-2 border rounded-md transition appearance-none text-sm text-center cursor-pointer ${
                                preferences.theme === 'light' ? 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 focus:ring-orange-500' :
                                preferences.theme === 'sepia' ? 'bg-[#fbf0d9] border-[#dcd3c1] text-[#5f4b32] hover:border-[#c8b79a] focus:ring-[#c8a063]' :
                                'bg-stone-800 border-stone-600 text-stone-300 hover:border-stone-500 focus:ring-amber-500'
                            }`}
                            aria-label="Chọn chương"
                        >
                            {story.volumes.map(volume => (
                                <optgroup label={volume.title} key={volume.id} className={`${preferences.theme === 'dark' ? 'bg-stone-900' : preferences.theme === 'sepia' ? 'bg-[#fbf0d9]' : 'bg-white'} font-semibold`}>
                                    {volume.chapters.map(chap => (
                                        <option key={chap.id} value={chap.id} className="font-normal">{chap.title}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {/* Next Button */}
                        {nextChapter ? (
                             <Link
                                to={`/story/${story.id}/chapter/${nextChapter.id}`}
                                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-md transition-colors duration-200 text-sm font-medium ${
                                    preferences.theme === 'light' ? 'border-orange-300 text-slate-700 hover:bg-orange-50' :
                                    preferences.theme === 'sepia' ? 'border-[#c8b79a] text-[#5f4b32] hover:bg-[#f5e9d3]' :
                                    'border-stone-600 text-stone-300 hover:bg-stone-700'
                                }`}
                                onClick={handleNavClick}
                            >
                                <span>Chương tiếp</span>
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        ) : (
                             <div className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-md text-sm font-medium cursor-not-allowed ${
                                 preferences.theme === 'light' ? 'border-slate-200 bg-slate-50 text-slate-400' :
                                 preferences.theme === 'sepia' ? 'border-[#dcd3c1] bg-[#f5e9d3]/50 text-[#a0927c]' :
                                 'border-stone-700 bg-stone-800 text-stone-500'
                             }`}>
                                <span>Chương tiếp</span>
                                <ArrowRightIcon className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                </div>

                {/* CommentSection (Không đổi logic) */}
                {storyId && chapterId && <CommentSection storyId={storyId} chapterId={chapterId} />}
            </div>
            <ReaderControls
                preferences={preferences}
                setPreferences={setPreferences}
            />
        </div>
    );
};

export default ReaderPage;
