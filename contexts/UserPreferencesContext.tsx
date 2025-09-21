// file: contexts/UserPreferencesContext.tsx

import React, { createContext, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import * as userService from '../services/userService.ts';
import { Bookmark } from '../types.ts';

interface UserPreferencesContextType {
    favorites: string[];
    toggleFavorite: (storyId: string) => void;
    isFavorite: (storyId: string) => boolean;
    
    bookmarks: Record<string, Bookmark>;
    updateBookmark: (storyId: string, chapterId: string, progress: number) => Promise<void>; // Thay đổi thành async
    removeBookmark: (storyId: string) => void;
    getBookmark: (storyId: string) => Bookmark | undefined;

    ratedStories: Record<string, number>;
    addRating: (storyId: string, rating: number) => void;
    getUserRating: (storyId: string) => number | undefined;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, updateUserPreferencesState } = useAuth();
    
    const favorites = useMemo(() => currentUser?.favorites || [], [currentUser]);
    const bookmarks = useMemo(() => currentUser?.bookmarks || {}, [currentUser]);
    const ratedStories = useMemo(() => currentUser?.ratedStories || {}, [currentUser]);
    
    // --- BẮT ĐẦU THAY ĐỔI LỚN ---

    // Hàm toggleFavorite không cần debounce nữa, gọi trực tiếp
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
            alert("Đã xảy ra lỗi khi cập nhật yêu thích, vui lòng thử lại.");
        }
    }, [currentUser, updateUserPreferencesState]);
    
    // Hàm updateBookmark giờ sẽ gọi API trực tiếp, không còn debounce
    const updateBookmark = useCallback(async (storyId: string, chapterId: string, progress: number) => {
        if (!currentUser) return;
        
        const oldBookmarks = currentUser.bookmarks || {};

        const newBookmark: Bookmark = {
            chapterId,
            progress: Math.round(progress),
            lastRead: new Date().toISOString()
        };
        const newBookmarks = { ...oldBookmarks, [storyId]: newBookmark };
        
        updateUserPreferencesState({ bookmarks: newBookmarks });

        try {
            // Gọi API ngay lập tức
            await userService.updateUserPreferences({ bookmarks: newBookmarks });
        } catch (error) {
            console.error("Lỗi đồng bộ bookmark:", error);
            // Nếu lỗi, khôi phục lại trạng thái cũ để tránh sai lệch dữ liệu
            updateUserPreferencesState({ bookmarks: oldBookmarks });
        }
    }, [currentUser, updateUserPreferencesState]);
    
    // --- KẾT THÚC THAY ĐỔI LỚN ---
    
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
