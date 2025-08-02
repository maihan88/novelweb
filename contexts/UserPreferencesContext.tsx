
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.tsx';

interface UserPreferencesContextType {
    favorites: string[]; // array of story IDs
    toggleFavorite: (storyId: string) => void;
    isFavorite: (storyId: string) => boolean;
    bookmarks: Record<string, string>; // { storyId: chapterId }
    updateBookmark: (storyId: string, chapterId: string) => void;
    getBookmark: (storyId: string) => string | undefined;
    ratedStories: Record<string, number>; // { storyId: rating }
    addRating: (storyId: string, rating: number) => void;
    getUserRating: (storyId: string) => number | undefined;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useLocalStorage<string[]>('user:favorites', []);
    const [bookmarks, setBookmarks] = useLocalStorage<Record<string, string>>('user:bookmarks', {});
    const [ratedStories, setRatedStories] = useLocalStorage<Record<string, number>>('user:ratings', {});

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

    const updateBookmark = useCallback((storyId: string, chapterId: string) => {
        setBookmarks(prev => ({ ...prev, [storyId]: chapterId }));
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

    const value = { favorites, toggleFavorite, isFavorite, bookmarks, updateBookmark, getBookmark, ratedStories, addRating, getUserRating };

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