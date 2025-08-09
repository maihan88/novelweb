import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { useAuth } from './AuthContext.tsx';

export interface Bookmark {
  chapterId: string;
  progress: number;
  lastRead: string;
}

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
    const { currentUser } = useAuth();
    
    // Tạo key động. Nếu không có user, key sẽ là `null`.
    const userId = currentUser?._id;
    const favoritesKey = userId ? `user:${userId}:favorites` : null;
    const bookmarksKey = userId ? `user:${userId}:bookmarks` : null;
    const ratingsKey = userId ? `user:${userId}:ratings` : null;
    
    const [favorites, setFavorites] = useLocalStorage<string[]>(favoritesKey, []);
    const [bookmarks, setBookmarks] = useLocalStorage<Record<string, Bookmark>>(bookmarksKey, {});
    const [ratedStories, setRatedStories] = useLocalStorage<Record<string, number>>(ratingsKey, {});
    
    const toggleFavorite = useCallback((storyId: string) => {
        setFavorites(prev => 
            prev.includes(storyId) 
                ? prev.filter(id => id !== storyId)
                : [...prev, storyId]
        );
    }, [setFavorites]);

    const isFavorite = useCallback((storyId: string) => {
        return favorites.includes(storyId);
    }, [favorites]);

    const updateBookmark = useCallback((storyId: string, chapterId: string, progress: number) => {
        setBookmarks(prev => ({
            ...prev,
            [storyId]: {
                chapterId,
                progress: Math.round(progress),
                lastRead: new Date().toISOString()
            }
        }));
    }, [setBookmarks]);

    const getBookmark = useCallback((storyId: string) => {
        return bookmarks[storyId];
    }, [bookmarks]);
    
    const addRating = useCallback((storyId: string, rating: number) => {
        setRatedStories(prev => ({...prev, [storyId]: rating}));
    }, [setRatedStories]);

    const getUserRating = useCallback((storyId: string) => {
        return ratedStories[storyId];
    }, [ratedStories]);

    const removeBookmark = useCallback((storyId: string) => {
        setBookmarks(prev => {
            const newBookmarks = { ...prev };
            delete newBookmarks[storyId];
            return newBookmarks;
        });
    }, [setBookmarks]);

    const value = { favorites, toggleFavorite, isFavorite, removeBookmark, bookmarks, updateBookmark, getBookmark, ratedStories, addRating, getUserRating };

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