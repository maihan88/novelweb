import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Story, Chapter, ReaderPreferences, ReaderTheme } from '../types';
import { useStories } from '../contexts/StoryContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import * as storyService from '../services/storyService';
import { syncReadingProgress } from '../services/userService';
import ReaderControls from '../components/ReaderControls';
import CommentSection from '../components/CommentSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon, SunIcon, MoonIcon, ListBulletIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

// --- ReadingProgressBar (Giữ nguyên) ---
const ReadingProgressBar: React.FC<{ progress: number }> = React.memo(({ progress }) => {
    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-[60] pointer-events-none">
            <div
                className="h-1 bg-sukem-primary origin-left shadow-[0_0_10px_var(--color-sukem-primary)]"
                style={{ transform: `scaleX(${progress / 100})`, transition: 'transform 150ms ease-out', willChange: 'transform' }}
            />
        </div>
    );
});
ReadingProgressBar.displayName = 'ReadingProgressBar';

// --- FloatingNavBar (Giữ nguyên) ---
const FloatingNavBar: React.FC<{ story: Story; currentChapterId: string; prevChapter?: Chapter | null; nextChapter?: Chapter | null; isVisible: boolean; }> = ({ story, currentChapterId, prevChapter, nextChapter, isVisible }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value) navigate(`/story/${story.id}/chapter/${e.target.value}`);
    };

    const btnBaseClass = "p-2 rounded-full transition-all duration-200 flex items-center justify-center";
    const btnActive = "hover:bg-sukem-primary hover:text-white text-sukem-text active:scale-95";
    const btnDisabled = "opacity-30 cursor-not-allowed text-sukem-text-muted";

    return (
        <div className={`fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-500 ease-spring ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'}`}>
            <div className="pointer-events-auto flex items-center gap-1 sm:gap-3 px-3 py-2 bg-sukem-card/90 backdrop-blur-xl border border-sukem-border shadow-2xl rounded-full max-w-[95vw] sm:max-w-3xl transform transition-all">
                <Link to={`/story/${story.id}`} className={`${btnBaseClass} ${btnActive}`} title="Về trang truyện"><HomeIcon className="h-5 w-5" /></Link>
                <div className="w-px h-5 bg-sukem-border mx-1"></div>
                <Link to={prevChapter ? `/story/${story.id}/chapter/${prevChapter.id}` : '#'} className={`${btnBaseClass} ${prevChapter ? btnActive : btnDisabled}`} aria-disabled={!prevChapter}><ArrowLeftIcon className="h-5 w-5" /></Link>
                
                <div className="relative group max-w-[140px] sm:max-w-[200px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none"><ListBulletIcon className="h-4 w-4 text-sukem-text-muted" /></div>
                    <select value={currentChapterId} onChange={handleChapterSelect} className="w-full pl-8 pr-4 py-1.5 bg-transparent text-sm font-medium text-sukem-text border-none focus:ring-0 cursor-pointer appearance-none truncate text-center hover:text-sukem-primary transition-colors">
                        {story.volumes.map(volume => (
                            <optgroup label={volume.title} key={volume.id} className="bg-sukem-card text-sukem-text font-bold">
                                {volume.chapters.map(chap => (<option key={chap.id} value={chap.id} className="font-normal">{chap.title}</option>))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <Link to={nextChapter ? `/story/${story.id}/chapter/${nextChapter.id}` : '#'} className={`${btnBaseClass} ${nextChapter ? btnActive : btnDisabled}`} aria-disabled={!nextChapter}><ArrowRightIcon className="h-5 w-5" /></Link>
                <div className="w-px h-5 bg-sukem-border mx-1"></div>
                <button onClick={toggleTheme} className={`${btnBaseClass} ${theme === 'dark' ? 'text-amber-400 hover:bg-slate-700' : 'text-sukem-primary hover:bg-sukem-bg'}`}>
                    {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

// --- THEME SETTINGS (Giữ nguyên) ---
const themeSpecificStyles: Record<ReaderTheme, { container: string; title: string; breadcrumb: string; breadcrumbActive: string; content: string; border: string; button: string; buttonHover: string; selectBg: string; selectBorder: string; }> = {
    light: { container: 'bg-[#FFF8E7]', title: 'text-[#4A2C2A]', breadcrumb: 'text-[#6E5C58] hover:text-[#FF6F91]', breadcrumbActive: 'text-[#FF6F91]', content: 'text-[#4A2C2A]', border: 'border-[#E8D5B5]', button: 'border-[#E8D5B5] text-[#4A2C2A] bg-[#FDEBD0]', buttonHover: 'hover:bg-[#FF6F91] hover:text-white hover:border-[#FF6F91]', selectBg: 'bg-[#FDEBD0]', selectBorder: 'border-[#E8D5B5]' },
    sepia: { container: 'bg-[#fbf0d9]', title: 'text-[#433422]', breadcrumb: 'text-[#8c6d46] hover:text-[#5f4b32]', breadcrumbActive: 'text-[#5f4b32]', content: 'text-[#5f4b32]', border: 'border-[#dcd3c1]', button: 'border-[#c8b79a] text-[#5f4b32] bg-[#fbf0d9]', buttonHover: 'hover:bg-[#f5e9d3] hover:border-[#a08d70]', selectBg: 'bg-[#fbf0d9]', selectBorder: 'border-[#dcd3c1]' },
    dark: { container: 'bg-[#1c1917]', title: 'text-[#e7e5e4]', breadcrumb: 'text-[#a8a29e] hover:text-[#fbbf24]', breadcrumbActive: 'text-[#fbbf24]', content: 'text-[#d6d3d1]', border: 'border-[#44403c]', button: 'border-[#57534e] text-[#d6d3d1] bg-[#292524]', buttonHover: 'hover:bg-[#44403c] hover:border-[#78716c] hover:text-white', selectBg: 'bg-[#292524]', selectBorder: 'border-[#57534e]' },
    paper: { container: 'bg-[#f5f5f4]', title: 'text-[#292524]', breadcrumb: 'text-[#78716c] hover:text-[#292524]', breadcrumbActive: 'text-[#292524]', content: 'text-[#44403c]', border: 'border-[#d6d3d1]', button: 'border-[#d6d3d1] text-[#44403c] bg-[#f5f5f4]', buttonHover: 'hover:bg-[#e7e5e4] hover:border-[#a8a29e]', selectBg: 'bg-[#f5f5f4]', selectBorder: 'border-[#d6d3d1]' },
    midnight: { container: 'bg-[#0f172a]', title: 'text-[#e2e8f0]', breadcrumb: 'text-[#64748b] hover:text-[#94a3b8]', breadcrumbActive: 'text-[#94a3b8]', content: 'text-[#cbd5e1]', border: 'border-[#1e293b]', button: 'border-[#334155] text-[#cbd5e1] bg-[#1e293b]', buttonHover: 'hover:bg-[#334155] hover:text-white hover:border-[#475569]', selectBg: 'bg-[#1e293b]', selectBorder: 'border-[#334155]' },
    matrix: { container: 'bg-black', title: 'text-[#22c55e]', breadcrumb: 'text-[#15803d] hover:text-[#4ade80]', breadcrumbActive: 'text-[#4ade80]', content: 'text-[#4ade80]', border: 'border-[#14532d]', button: 'border-[#14532d] text-[#22c55e] bg-black', buttonHover: 'hover:bg-[#052e16] hover:border-[#22c55e] hover:text-[#4ade80]', selectBg: 'bg-black', selectBorder: 'border-[#14532d]' }
};

const marginSettings: Record<number, { padding: string; maxWidth: string }> = {
    0:  { padding: 'px-2 sm:px-4',   maxWidth: 'max-w-none' },    
    5:  { padding: 'px-4 sm:px-6',   maxWidth: 'max-w-5xl' },    
    10: { padding: 'px-5 sm:px-8',   maxWidth: 'max-w-4xl' },    
    15: { padding: 'px-6 sm:px-12',  maxWidth: 'max-w-3xl' },    
    20: { padding: 'px-8 sm:px-16',  maxWidth: 'max-w-2xl' }    
};

const ReaderPage: React.FC = () => {
    const { storyId, chapterId } = useParams<{ storyId: string, chapterId: string }>();
    const navigate = useNavigate();
    const { getStoryById, incrementChapterView } = useStories();
    const { bookmarks, updateBookmark } = useUserPreferences();
    const { currentUser } = useAuth();

    const [story, setStory] = useState<Story | null>(null);
    const [currentChapterWithContent, setCurrentChapterWithContent] = useState<Chapter | null>(null);
    const [loadingStory, setLoadingStory] = useState(true);
    const [loadingChapter, setLoadingChapter] = useState(false);

    const [preferences, setPreferences] = useLocalStorage<ReaderPreferences>('readerPreferences', {
        fontSize: 18, fontFamily: 'font-reader-lora', lineHeight: 1.7, margin: 10, theme: 'light', textAlign: 'text-justify'
    });

    const [scrollPercent, setScrollPercent] = useState(0);
    const progressRef = useRef(0);
    const viewIncrementedRef = useRef(false);
    const readerContentRef = useRef<HTMLDivElement>(null);
    const [isFloatingNavVisible, setIsFloatingNavVisible] = useState(false);
    const lastTap = useRef(0);
    
    // --- FIX: Refs for syncing with Titles ---
    const updateBookmarkRef = useRef(updateBookmark);
    const currentUserRef = useRef(currentUser);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentTitlesRef = useRef<{ chapter: string; volume: string }>({ chapter: '', volume: '' }); // Lưu Title vào Ref

    useEffect(() => { updateBookmarkRef.current = updateBookmark; });
    useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);

    // 1. Fetch Story
    useEffect(() => {
        if (!storyId) return;
        if (!story || story.id !== storyId) {
            setLoadingStory(true);
            getStoryById(storyId).then(fetchedStory => {
                setStory(fetchedStory || null);
                setLoadingStory(false);
            }).catch(() => setLoadingStory(false));
        }
    }, [storyId, story, getStoryById]);

    // 2. Fetch Content
    useEffect(() => {
        const loadContent = async () => {
            if (!storyId || !chapterId) return;
            setLoadingChapter(true);
            setCurrentChapterWithContent(null);
            try {
                const fullChapter = await storyService.getChapterContent(storyId, chapterId);
                setCurrentChapterWithContent(fullChapter);
            } catch (error) { console.error("Failed to load content", error); } 
            finally { setLoadingChapter(false); }
        };
        loadContent();
    }, [storyId, chapterId]);

    // --- FIX: Cập nhật currentTitlesRef khi có dữ liệu chương mới ---
    useEffect(() => {
        if (story && currentChapterWithContent && currentChapterWithContent.id === chapterId) {
            let vTitle = '';
            const vol = story.volumes.find(v => v.chapters.some(c => c.id === chapterId));
            if (vol) vTitle = vol.title;
            
            // Cập nhật ref để dùng cho cleanup/scroll
            currentTitlesRef.current = {
                chapter: currentChapterWithContent.title,
                volume: vTitle
            };
        }
    }, [story, currentChapterWithContent, chapterId]);

    // 3. Scroll Restoration & View Increment
    useEffect(() => {
        if (!currentChapterWithContent) return;
        viewIncrementedRef.current = false;

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
                        }
                    }
                 }, 150);
            });
        } else {
             window.scrollTo(0, 0);
             progressRef.current = 0;
             setScrollPercent(0);
        }
    }, [storyId, chapterId, currentChapterWithContent]);

    // 4. Scroll Listener & Sync Logic
    useEffect(() => {
        if (!story || !storyId || !chapterId) return;
        
        if (!viewIncrementedRef.current && !isAdmin && currentChapterWithContent) {
            incrementChapterView(storyId, chapterId);
            viewIncrementedRef.current = true;
        }

        const preventAction = (e: Event) => e.preventDefault();
        const contentEl = readerContentRef.current;
        if (contentEl) {
            contentEl.addEventListener('contextmenu', preventAction);
            contentEl.addEventListener('copy', preventAction);
        }

        const debouncedSave = (newProgress: number) => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            
            syncTimeoutRef.current = setTimeout(async () => {
                const finalProgress = Math.round(newProgress >= 99 ? 100 : newProgress);
                const { chapter: cTitle, volume: vTitle } = currentTitlesRef.current; // Lấy từ Ref

                // 1. Cập nhật Local State
                updateBookmarkRef.current(storyId, chapterId, finalProgress, cTitle, vTitle);

                // 2. Sync Server
                if (currentUserRef.current) {
                    try {
                        await syncReadingProgress(storyId, chapterId, finalProgress, cTitle, vTitle);
                    } catch (err) {
                        console.error('Lỗi sync:', err);
                    }
                }
            }, 1000);
        };

        const handleScroll = () => {
            const contentElement = readerContentRef.current;
            if (!contentElement) return;
            const contentTop = contentElement.offsetTop;
            const contentHeight = contentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const currentScrollTop = window.pageYOffset;
            let percentage = 0;
            if (contentHeight <= viewportHeight) { percentage = 100; } 
            else {
                 const scrollStartInContent = Math.max(0, currentScrollTop - contentTop);
                 const maxScrollInContent = contentHeight - viewportHeight;
                 percentage = maxScrollInContent > 0 ? Math.min(100, (scrollStartInContent / maxScrollInContent) * 100) : 100;
            }
            
            if (Math.abs(percentage - progressRef.current) > 1) {
                progressRef.current = percentage;
                setScrollPercent(percentage);
                debouncedSave(percentage);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (contentEl) { contentEl.removeEventListener('contextmenu', preventAction); contentEl.removeEventListener('copy', preventAction); }
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            
            if (storyId && chapterId) {
                 const finalProgress = Math.round(progressRef.current >= 99 ? 100 : progressRef.current);
                 // --- FIX QUAN TRỌNG: Dùng currentTitlesRef.current để lấy title cho cleanup ---
                 const { chapter: cTitle, volume: vTitle } = currentTitlesRef.current;
                 
                 updateBookmarkRef.current(storyId, chapterId, finalProgress, cTitle, vTitle);
                 if(currentUserRef.current) {
                     syncReadingProgress(storyId, chapterId, finalProgress, cTitle, vTitle).catch(console.error);
                 }
            }
        };
    }, [story, storyId, chapterId, isAdmin, incrementChapterView, currentChapterWithContent]);

    // ... phần render giữ nguyên ...
    const handleTapZoneClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (window.getSelection()?.toString() || (event.target as HTMLElement).closest('a, button, select, [data-control-button]')) return;
        const now = Date.now();
        if (now - lastTap.current < 400) setIsFloatingNavVisible(p => !p);
        lastTap.current = now;
    };

    const { prevChapter, nextChapter } = useMemo(() => {
        if (!story || !chapterId) return { prevChapter: null, nextChapter: null };
        const allChapters = story.volumes.flatMap(v => v.chapters);
        const index = allChapters.findIndex(c => c.id === chapterId);
        if (index === -1) return { prevChapter: null, nextChapter: null };
        return { prevChapter: index > 0 ? allChapters[index - 1] : null, nextChapter: index < allChapters.length - 1 ? allChapters[index + 1] : null };
    }, [story, chapterId]);

    const cleanedContent = useMemo(() => {
        if (!currentChapterWithContent?.content) return '';
        return currentChapterWithContent.content.replace(/line-height:[^;"]*;/g, '');
    }, [currentChapterWithContent?.content]);

    const contentStyle = useMemo(() => ({ fontSize: `${preferences.fontSize}px`, lineHeight: preferences.lineHeight }), [preferences.fontSize, preferences.lineHeight]);
    const handleChapterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => { if (e.target.value) navigate(`/story/${storyId}/chapter/${e.target.value}`); };

    if (loadingStory || (loadingChapter && !currentChapterWithContent)) return <div className="flex justify-center items-center h-screen bg-sukem-bg"><LoadingSpinner /></div>;
    if (!story || !currentChapterWithContent) return <div className="flex justify-center items-center h-screen bg-sukem-bg text-sukem-primary">Không tìm thấy truyện hoặc chương.</div>;

    const themeStyle = themeSpecificStyles[preferences.theme] || themeSpecificStyles.light;
    const currentMarginSetting = marginSettings[preferences.margin] || marginSettings[10];
    const pageClasses = `min-h-full transition-colors duration-300 ${themeStyle.container}`;
    const contentContainerClasses = `mx-auto animate-fade-in py-20 min-h-screen ${currentMarginSetting.padding} ${currentMarginSetting.maxWidth}`;

    return (
        <div className={pageClasses}>
            <ReadingProgressBar progress={scrollPercent} />
            <FloatingNavBar story={story} currentChapterId={chapterId!} prevChapter={prevChapter} nextChapter={nextChapter} isVisible={isFloatingNavVisible} />
            
            <div onClick={handleTapZoneClick} className={contentContainerClasses}>
                <div className="text-center mb-12">
                    <nav className="flex justify-center items-center gap-2 text-sm sm:text-base font-medium mb-3">
                        <Link to={`/story/${story.id}`} className={`transition-colors ${themeStyle.breadcrumb}`}>{story.title}</Link>
                    </nav>
                    <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold font-serif leading-tight px-2 ${themeStyle.title}`}>
                        {currentChapterWithContent.title}
                    </h1>
                </div>
                
                <div ref={readerContentRef}
                    className={`max-w-none transition-all duration-300 ${preferences.fontFamily} ${preferences.textAlign} chapter-content prevent-copy ${themeStyle.content}`}
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: cleanedContent }}
                />

                <div className={`mt-16 pt-10 border-t ${themeStyle.border}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                        {prevChapter ? (
                             <Link to={`/story/${story.id}/chapter/${prevChapter.id}`} className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow active:scale-95 ${themeStyle.button} ${themeStyle.buttonHover}`}>
                                <ArrowLeftIcon className="h-5 w-5" /> <span>Chương trước</span>
                            </Link>
                        ) : (
                             <div className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg font-medium opacity-50 cursor-not-allowed ${themeStyle.button}`}><ArrowLeftIcon className="h-5 w-5" /> <span>Chương trước</span></div>
                        )}
                        <div className="flex-grow sm:flex-grow-0 sm:min-w-[250px]">
                            <select value={chapterId} onChange={handleChapterSelect} className={`w-full px-4 py-3 border rounded-lg transition appearance-none text-center cursor-pointer font-medium focus:ring-2 focus:ring-opacity-50 focus:ring-sukem-accent focus:outline-none ${themeStyle.selectBg} ${themeStyle.selectBorder} ${themeStyle.content}`}>
                                {story.volumes.map(volume => (
                                    <optgroup label={volume.title} key={volume.id} className={themeStyle.selectBg}>
                                         {volume.chapters.map(chap => (<option key={chap.id} value={chap.id} className="font-normal py-1">{chap.title}</option>))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        {nextChapter ? (
                             <Link to={`/story/${story.id}/chapter/${nextChapter.id}`} className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow active:scale-95 ${themeStyle.button} ${themeStyle.buttonHover}`}>
                                <span>Chương tiếp</span> <ArrowRightIcon className="h-5 w-5" />
                            </Link>
                        ) : (
                             <div className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-lg font-medium opacity-50 cursor-not-allowed ${themeStyle.button}`}><span>Chương tiếp</span> <ArrowRightIcon className="h-5 w-5" /></div>
                        )}
                    </div>
                </div>
                {storyId && chapterId && <CommentSection storyId={storyId} chapterId={chapterId} />}
            </div>
            <ReaderControls preferences={preferences} setPreferences={setPreferences} />
        </div>
    );
};

export default ReaderPage;