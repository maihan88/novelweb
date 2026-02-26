import api from './api';
import { Bookmark, User } from '../types';

interface UserPreferences {
    favorites: string[];
    bookmarks: Record<string, Bookmark>;
    ratedStories: Record<string, number>;
}

// Định nghĩa interface trả về cho Auth
export interface AuthResponse extends User {
    token: string;
    favorites: string[];
    bookmarks: Record<string, Bookmark>;
    ratedStories: Record<string, number>;
}

export const userService = {
    // 1. API Đăng nhập
    login: async (username: string, pass: string): Promise<AuthResponse> => {
        const response = await api.post('/users/login', { username, password: pass });
        return response.data;
    },

    // 2. API Đăng ký
    register: async (username: string, pass: string) => {
        const response = await api.post('/users/register', { username, password: pass });
        return response;
    },

    // 3. API Lấy profile (Dùng để sync)
    getProfile: async (): Promise<Partial<AuthResponse>> => {
        const response = await api.get('/users/profile');
        return response.data;
    },


    updateUserPreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
        const response = await api.put('/users/preferences', preferences);
        return response.data;
    },

    syncReadingProgress: async (
        storyId: string, 
        chapterId: string, 
        progress: number,
        chapterTitle?: string,
        volumeTitle?: string
    ) => {
        const response = await api.put('/users/progress', { 
            storyId, chapterId, progress, chapterTitle, volumeTitle 
        });
        return response.data;
    }
};