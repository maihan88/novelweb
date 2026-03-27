import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { userService } from '../services/userService';
import { Bookmark } from '../types';

interface UserPreferencesContextType {
    favorites: string[];
    toggleFavorite: (storyId: string) => Promise<void>;
    isFavorite: (storyId: string) => boolean;
    
    bookmarks: Record<string, Bookmark>;
    updateBookmark: (storyId: string, chapterId: string, progress: number, chapterTitle?: string, volumeTitle?: string) => Promise<void>;
    removeBookmark: (storyId: string) => Promise<void>;
    getBookmark: (storyId: string) => Bookmark | undefined;

    ratedStories: Record<string, number>;
    addRating: (storyId: string, rating: number) => Promise<void>;
    getUserRating: (storyId: string) => number | undefined;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, updateUserPreferencesState } = useAuth();
    
    const favorites = useMemo(() => currentUser?.favorites || [], [currentUser]);
    const bookmarks = useMemo(() => currentUser?.bookmarks || {}, [currentUser]);
    const ratedStories = useMemo(() => currentUser?.ratedStories || {}, [currentUser]);
    
    const toggleFavorite = useCallback(async (storyId: string) => {
        if (!currentUser) return;

        const oldFavorites = currentUser.favorites || [];
        const newFavorites = oldFavorites.includes(storyId)
            ? oldFavorites.filter(id => id !== storyId)
            : [...oldFavorites, storyId];

        updateUserPreferencesState({ favorites: newFavorites });

        try {
            await userService.updateUserPreferences({ favorites: newFavorites });
        } catch (error) {
            console.error("Lỗi đồng bộ yêu thích:", error);
            updateUserPreferencesState({ favorites: oldFavorites });
        }
    }, [currentUser, updateUserPreferencesState]);
    
    const updateBookmark = useCallback(async (
        storyId: string, 
        chapterId: string, 
        progress: number,
        chapterTitle?: string, 
        volumeTitle?: string
    ) => {
        if (!currentUser) return;
        
        const oldBookmarks = currentUser.bookmarks || {};

        const currentBookmark = oldBookmarks[storyId];
        
        const newBookmark: Bookmark = {
            chapterId,
            progress: Math.round(progress),
            lastRead: new Date().toISOString(),
            chapterTitle: chapterTitle || currentBookmark?.chapterTitle || '',
            volumeTitle: volumeTitle || currentBookmark?.volumeTitle || ''
        };

        const newBookmarks = { ...oldBookmarks, [storyId]: newBookmark };
        
        updateUserPreferencesState({ bookmarks: newBookmarks });

        try {
            await userService.updateUserPreferences({ bookmarks: newBookmarks });
        } catch (error) {
            console.error("Lỗi đồng bộ bookmark:", error);
            updateUserPreferencesState({ bookmarks: oldBookmarks });
        }
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