import api from './api.ts';
import { Comment } from '../types.ts';

export const getComments = async (storyId: string, chapterId: string): Promise<Comment[]> => {
    const response = await api.get(`/comments`, {
        params: { storyId, chapterId }
    });
    return response.data;
};

export const addComment = async (commentData: Omit<Comment, 'id' | '_id' | 'timestamp'>): Promise<Comment> => {
    const response = await api.post('/comments', commentData);
    return response.data;
};
