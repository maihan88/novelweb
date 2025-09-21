// file: pages/ReaderPage.tsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Story, Chapter, ReaderPreferences } from '../types';
import { useStories } from '../contexts/StoryContext.tsx';
import { useUserPreferences } from '../contexts/UserPreferencesContext.tsx';
import ReaderControls from '../components/ReaderControls.tsx';
import CommentSection from '../components/CommentSection.tsx';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import {
    ArrowLeftIcon, ArrowRightIcon,
    HomeIcon, XMarkIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext.tsx';

const ReadingProgressBar: React.FC<{ progress: number }> = React.memo(({ progress }) => {
    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 z-50">
            <div
                className="h-1 bg-orange-900 dark:bg-amber-200 origin-left"
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

const AutoScrollWarning: React.FC<{ isVisible: boolean; onClose: () => void }> = ({ isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
            <span className="text-sm font-medium">Hãy hủy kích hoạt auto scroll trước rồi mới chuyển trang, bạn nhé!</span>
            <button onClick={onClose} className="p-1 hover:bg-orange-700 rounded">
                <XMarkIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

const FloatingNavBar: React.FC<{
    story: Story;
    currentChapterId: string;
    prevChapter?: Chapter | null;
    nextChapter?: Chapter | null;
    isVisible: boolean;
    isAutoScrolling: boolean;
    onAutoScrollWarning: () => void;
}> = ({ story, currentChapterId, prevChapter, nextChapter, isVisible, isAutoScrolling, onAutoScrollWarning }) => {
    const navigate = useNavigate();
    
    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isAutoScrolling) {
            onAutoScrollWarning();
            return;
        }
        const newChapterId = e.target.value;
        if (newChapterId) navigate(`/story/${story.id}/chapter/${newChapterId}`);
    };

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isAutoScrolling) {
            e.preventDefault();
            onAutoScrollWarning();
        }
    };

    const navButtonClasses = "p-3 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    return (
        <div className={`fixed top-0 left-0 w-full p-2 z-50 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="container mx-auto max-w-3xl flex items-center gap-2 text-white bg-black/50 p-2 rounded-lg shadow-lg">
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
                    className={navButtonClasses} 
                    aria-disabled={!prevChapter} 
                    aria-label="Chương trước"
                    onClick={handleNavigation}
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <select 
                    value={currentChapterId} 
                    onChange={handleChapterSelect} 
                    className="w-full flex-grow px-3 py-2 border-0 rounded-md bg-white/10 text-white focus:ring-2 focus:ring-amber-300 transition appearance-none text-center" 
                    aria-label="Chọn chương"
                >
                    {story.volumes.map(volume => (
                        <optgroup label={volume.title} key={volume.id} className="bg-stone-800">
                            {volume.chapters.map(chap => (<option key={chap.id} value={chap.id}>{chap.title}</option>))}
                        </optgroup>
                    ))}
                </select>
                <Link 
                    to={nextChapter ? `/story/${story.id}/chapter/${nextChapter.id}` : '#'} 
                    className={navButtonClasses} 
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

const ReaderPage: React.FC = () => {
    const { storyId, chapterId } = useParams<{ storyId: string, chapterId: string }>();
    const navigate = useNavigate();
    const { getStoryById, incrementChapterView } = useStories();
    const { bookmarks, updateBookmark } = useUserPreferences();
    const { currentUser } = useAuth();

    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState<ReaderPreferences>({ fontSize: 18, fontFamily: 'font-serif', lineHeight: 1.7 });
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [showAutoScrollWarning, setShowAutoScrollWarning] = useState(false);
    
    const [scrollPercent, setScrollPercent] = useState(0);
    const progressRef = useRef(0);
    const viewIncrementedRef = useRef(false);
    const readerContentRef = useRef<HTMLDivElement>(null);
    const [isFloatingNavVisible, setIsFloatingNavVisible] = useState(false);
    const lastTap = useRef(0);
    const scrollInterval = useRef<number | null>(null);
    const didRestoreBookmarkRef = useRef(false);

    // --- BẮT ĐẦU SỬA LỖI VÒNG LẶP ---
    // 1. Tạo một ref để giữ phiên bản mới nhất của hàm updateBookmark
    const updateBookmarkRef = useRef(updateBookmark);
    useEffect(() => {
        updateBookmarkRef.current = updateBookmark;
    });

    // 2. Tối ưu hóa dependency `currentUser` thành một giá trị boolean ổn định hơn
    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);
    // --- KẾT THÚC SỬA LỖI VÒNG LẶP ---

    // Effect 1: Lấy dữ liệu truyện
    useEffect(() => {
        if (!storyId) return;
        setLoading(true);
        getStoryById(storyId).then(fetchedStory => {
            setStory(fetchedStory || null);
            setLoading(false);
        });
    }, [storyId, getStoryById]);

    // Effect 2: Reset và khôi phục vị trí cuộn
    useEffect(() => {
        viewIncrementedRef.current = false;
        didRestoreBookmarkRef.current = false;
        window.scrollTo(0, 0); // Luôn cuộn lên đầu khi chương thay đổi

        const savedBookmark = storyId ? bookmarks[storyId] : null;
        if (savedBookmark && savedBookmark.chapterId === chapterId) {
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
                    }
                }
            }, 100);
        }
    }, [storyId, chapterId]); // Chỉ chạy khi chapterId hoặc storyId thay đổi

    // Effect 3: Quản lý scroll, view, và chống copy (ĐÃ ĐƯỢC SỬA)
    useEffect(() => {
        if (!story || !storyId || !chapterId) return;

        if (!viewIncrementedRef.current && !isAdmin) { // Sử dụng biến `isAdmin`
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
                percentage = Math.min(100, (scrollStartInContent / maxScrollInContent) * 100);
            }
            
            progressRef.current = percentage;
            setScrollPercent(percentage);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (contentEl) {
                contentEl.removeEventListener('contextmenu', preventAction);
                contentEl.removeEventListener('copy', preventAction);
            }

            if (storyId && chapterId) {
                const finalProgress = progressRef.current >= 98 ? 100 : progressRef.current;
                // Gọi hàm lưu bookmark thông qua ref
                updateBookmarkRef.current(storyId, chapterId, finalProgress);
            }
        };
    // Dependency array đã được dọn dẹp để phá vỡ vòng lặp
    }, [story, storyId, chapterId, isAdmin, incrementChapterView]); 
    
    // ... các useEffect và hàm xử lý còn lại không thay đổi ...

    const stopAutoScroll = useCallback(() => {
        if (scrollInterval.current) clearInterval(scrollInterval.current);
        scrollInterval.current = null;
        setIsAutoScrolling(false);
    }, []);
    
    const toggleAutoScroll = useCallback(() => {
        if (isAutoScrolling) {
            stopAutoScroll();
        } else {
            setIsAutoScrolling(true);
            scrollInterval.current = window.setInterval(() => {
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                    stopAutoScroll();
                } else {
                    window.scrollBy({ top: 1, behavior: 'auto' });
                }
            }, 50);
        }
    }, [isAutoScrolling, stopAutoScroll]);
    
    useEffect(() => {
        const stopOnInteraction = () => { if (isAutoScrolling) stopAutoScroll(); };
        window.addEventListener('wheel', stopOnInteraction, { passive: true });
        window.addEventListener('touchmove', stopOnInteraction, { passive: true });
        window.addEventListener('keydown', stopOnInteraction);
        return () => {
            window.removeEventListener('wheel', stopOnInteraction);
            window.removeEventListener('touchmove', stopOnInteraction);
            window.removeEventListener('keydown', stopOnInteraction);
        };
    }, [isAutoScrolling, stopAutoScroll]);

    const handleTapZoneClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (window.getSelection()?.toString() || (event.target as HTMLElement).closest('a, button')) {
            return;
        }
        const now = Date.now();
        if (now - lastTap.current < 300) {
            setIsFloatingNavVisible(p => !p);
        }
        lastTap.current = now;
    };

    const handleAutoScrollWarning = useCallback(() => setShowAutoScrollWarning(true), []);
    const hideAutoScrollWarning = useCallback(() => setShowAutoScrollWarning(false), []);
    
    const { chapter, prevChapter, nextChapter } = useMemo(() => {
        if (!story || !chapterId) return { chapter: undefined, prevChapter: null, nextChapter: null };
        const allChapters = story.volumes.flatMap(v => v.chapters);
        const index = allChapters.findIndex(c => c.id === chapterId);
        if (index === -1) return { chapter: undefined, prevChapter: null, nextChapter: null };
        return {
            chapter: allChapters[index],
            prevChapter: index > 0 ? allChapters[index - 1] : null,
            nextChapter: index < allChapters.length - 1 ? allChapters[index - 1] : null,
        };
    }, [story, chapterId]);
    
    const cleanedContent = useMemo(() => {
        if (!chapter?.content) return '';
        return chapter.content.replace(/line-height:[^;"]*;/g, '');
    }, [chapter?.content]);

    const contentStyle = useMemo(() => ({ 
        fontSize: `${preferences.fontSize}px`, 
        lineHeight: preferences.lineHeight 
    }), [preferences.fontSize, preferences.lineHeight]);
    
    const navButtonBaseClasses = "flex items-center justify-center gap-2 px-4 py-2 border rounded-md transition-colors duration-200";
    const navButtonEnabledClasses = "border-orange-300 dark:border-amber-300 hover:bg-orange-100 dark:hover:bg-amber-200/50";
    const navButtonDisabledClasses = "border-orange-200 dark:border-amber-100/50 bg-orange-50 dark:bg-amber-800/10 text-slate-400 dark:text-stone-500 cursor-not-allowed";
    
    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isAutoScrolling) {
            handleAutoScrollWarning();
            return;
        }
        const newChapterId = e.target.value;
        if (newChapterId) navigate(`/story/${storyId}/chapter/${newChapterId}`);
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (isAutoScrolling) {
            e.preventDefault();
            handleAutoScrollWarning();
        }
    };
    
    if (loading) return <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950"><LoadingSpinner /></div>;
    if (!story || !chapter) return <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-950 text-red-500">Không tìm thấy truyện hoặc chương.</div>;

    return (
        <div className="bg-white dark:bg-stone-950 min-h-full">
            <ReadingProgressBar progress={scrollPercent} />
            <AutoScrollWarning isVisible={showAutoScrollWarning} onClose={hideAutoScrollWarning} />
            <FloatingNavBar 
                story={story} 
                currentChapterId={chapterId!} 
                prevChapter={prevChapter} 
                nextChapter={nextChapter} 
                isVisible={isFloatingNavVisible}
                isAutoScrolling={isAutoScrolling}
                onAutoScrollWarning={handleAutoScrollWarning}
            />
            <div onClick={handleTapZoneClick} className="max-w-3xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-10">
                    <Link to={`/story/${story.id}`} className="text-orange-600 dark:text-amber-200 hover:underline">{story.title}</Link>
                    <h1 className="text-3xl sm:text-4xl font-bold font-serif mt-2 text-slate-900 dark:text-white">{chapter.title}</h1>
                </div>
                <div
                    ref={readerContentRef}
                    className={`max-w-none text-slate-800 dark:text-slate-200 transition-all duration-300 ${preferences.fontFamily} chapter-content prevent-copy`}
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: cleanedContent }}
                />
                <div className="mt-12 pt-6 border-t border-slate-300 dark:border-slate-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                        {prevChapter ? (
                            <Link 
                                to={`/story/${story.id}/chapter/${prevChapter.id}`} 
                                className={`${navButtonBaseClasses} ${navButtonEnabledClasses}`}
                                onClick={handleNavClick}
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                <span>Chương trước</span>
                            </Link>
                        ) : (
                            <div className={`${navButtonBaseClasses} ${navButtonDisabledClasses}`}>
                                <ArrowLeftIcon className="h-4 w-4" />
                                <span>Chương trước</span>
                            </div>
                        )}
                        <select 
                            value={chapterId} 
                            onChange={handleChapterSelect} 
                            className="w-full sm:w-auto flex-grow px-3 py-2 border rounded-md bg-white dark:bg-stone-800 border-slate-300 dark:border-stone-600 focus:ring-2 focus:ring-stone-500 transition" 
                            aria-label="Chọn chương"
                        >
                            {story.volumes.map(volume => (
                                <optgroup label={volume.title} key={volume.id}>
                                    {volume.chapters.map(chap => (
                                        <option key={chap.id} value={chap.id}>{chap.title}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {nextChapter ? (
                            <Link 
                                to={`/story/${story.id}/chapter/${nextChapter.id}`} 
                                className={`${navButtonBaseClasses} ${navButtonEnabledClasses}`}
                                onClick={handleNavClick}
                            >
                                <span>Chương tiếp</span>
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                        ) : (
                            <div className={`${navButtonBaseClasses} ${navButtonDisabledClasses}`}>
                                <span>Chương tiếp</span>
                                <ArrowRightIcon className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                </div>
                {storyId && chapterId && <CommentSection storyId={storyId} chapterId={chapterId} />}
            </div>
            <ReaderControls 
                preferences={preferences} 
                setPreferences={setPreferences} 
                isAutoScrolling={isAutoScrolling} 
                toggleAutoScroll={toggleAutoScroll} 
            />
        </div>
    );
};

export default ReaderPage;
