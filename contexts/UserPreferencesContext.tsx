// maihan88/novelweb/novelweb-30378715fdd33fd98f7c1318544ef93eab22c598/contexts/UserPreferencesContext.tsx
import React, { createContext, useContext, ReactNode, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import * as userService from '../services/userService.ts';
import { Bookmark } from '../types.ts';

interface UserPreferencesContextType {
    favorites: string[];
    toggleFavorite: (storyId: string) => void;
    isFavorite: (storyId: string) => boolean;
    
    bookmarks: Record<string, Bookmark>;
    updateBookmark: (storyId: string, chapterId: string, progress: number) => void;
    removeBookmark: (storyId: string) => void;
    getBookmark: (storyId: string) => Bookmark | undefined;

    ratedStories: Record<string, number>;
    addRating: (storyId: string, rating: number) => void;
    getUserRating: (storyId: string) => number | undefined;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, updateUserPreferencesState } = useAuth();
    
    // Refs để quản lý debounce
    const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const favorites = useMemo(() => currentUser?.favorites || [], [currentUser]);
    const bookmarks = useMemo(() => currentUser?.bookmarks || {}, [currentUser]);
    const ratedStories = useMemo(() => currentUser?.ratedStories || {}, [currentUser]);

    // Cleanup effect để xóa tất cả các timer khi unmount
    useEffect(() => {
        const timers = debounceTimersRef.current;
        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, []);

    const toggleFavorite = useCallback(async (storyId: string) => {
        if (!currentUser) return;

        const oldFavorites = currentUser.favorites || [];
        const newFavorites = oldFavorites.includes(storyId)
            ? oldFavorites.filter(id => id !== storyId)
            : [...oldFavorites, storyId];

        // Cập nhật state ở client ngay lập tức
        updateUserPreferencesState({ favorites: newFavorites });

        // Debounce việc gọi API
        const debounceKey = `favorite-${storyId}`;
        if (debounceTimersRef.current[debounceKey]) {
            clearTimeout(debounceTimersRef.current[debounceKey]);
        }

        debounceTimersRef.current[debounceKey] = setTimeout(async () => {
            try {
                await userService.updateUserPreferences({ favorites: newFavorites });
            } catch (error) {
                console.error("Lỗi đồng bộ yêu thích:", error);
                updateUserPreferencesState({ favorites: oldFavorites }); // Khôi phục nếu lỗi
                alert("Đã xảy ra lỗi khi cập nhật yêu thích, vui lòng thử lại.");
            }
        }, 1000); // Gửi request sau 1 giây

    }, [currentUser, updateUserPreferencesState]);
    
    const updateBookmark = useCallback((storyId: string, chapterId: string, progress: number) => {
        if (!currentUser) return;
        
        const oldBookmarks = currentUser.bookmarks || {};

        const newBookmark: Bookmark = {
            chapterId,
            progress: Math.round(progress),
            lastRead: new Date().toISOString()
        };
        const newBookmarks = { ...oldBookmarks, [storyId]: newBookmark };
        
        // Cập nhật state ở client ngay lập tức
        updateUserPreferencesState({ bookmarks: newBookmarks });

        // Debounce việc gọi API
        const debounceKey = `bookmark-${storyId}`;
        if (debounceTimersRef.current[debounceKey]) {
            clearTimeout(debounceTimersRef.current[debounceKey]);
        }

        debounceTimersRef.current[debounceKey] = setTimeout(async () => {
            try {
                // Gửi state mới nhất tại thời điểm API được gọi
                 const latestUserSnapshot = JSON.parse(localStorage.getItem('currentUser') || '{}');
                 if(latestUserSnapshot?._id === currentUser._id) {
                    await userService.updateUserPreferences({ bookmarks: latestUserSnapshot.bookmarks });
                 }
            } catch (error) {
                console.error("Lỗi đồng bộ bookmark:", error);
                updateUserPreferencesState({ bookmarks: oldBookmarks });
            }
        }, 2000); // Gửi request sau 2 giây ngừng cuộn

    }, [currentUser, updateUserPreferencesState]);
    
    const removeBookmark = useCallback(async (storyId: string) => {
        if (!currentUser) return;

        const oldBookmarks = currentUser.bookmarks || {};
        const newBookmarks = { ...oldBookmarks };
        delete newBookmarks[storyId];

        updateUserPreferencesState({ bookmarks: newBookmarks });

        try {
            await userService.updateUserPreferences({ bookmarks: newBookmarks });
        } catch (error) {
            console.error("Lỗi xóa bookmark:", error);
            updateUserPreferencesState({ bookmarks: oldBookmarks });
        }
    }, [currentUser, updateUserPreferencesState]);

    const addRating = useCallback(async (storyId: string, rating: number) => {
        if (!currentUser) return;
        
        const oldRatedStories = currentUser.ratedStories || {};
        const newRatedStories = { ...oldRatedStories, [storyId]: rating };

        updateUserPreferencesState({ ratedStories: newRatedStories });

        try {
            await userService.updateUserPreferences({ ratedStories: newRatedStories });
        } catch (error) {
            console.error("Lỗi đồng bộ đánh giá:", error);
            updateUserPreferencesState({ ratedStories: oldRatedStories });
        }
    }, [currentUser, updateUserPreferencesState]);

    const isFavorite = useCallback((storyId: string) => favorites.includes(storyId), [favorites]);
    const getBookmark = useCallback((storyId: string) => bookmarks[storyId], [bookmarks]);
    const getUserRating = useCallback((storyId: string) => ratedStories[storyId], [ratedStories]);

    const value = { favorites, toggleFavorite, isFavorite, bookmarks, updateBookmark, getBookmark, removeBookmark, ratedStories, addRating, getUserRating };

    return (
        <UserPreferencesContext.Provider value={value}>
            {children}
        </UserPreferencesContext.Provider>
    );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
