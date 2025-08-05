import api from './api';
import { Comment } from '../types';

export const getComments = async (storyId: string, chapterId: string): Promise<Comment[]> => {
  const response = await api.get('/comments', { params: { storyId, chapterId } });
  return response.data;
};

// Kiểu dữ liệu mới cho việc tạo bình luận, parentId là tùy chọn
type AddCommentData = {
    storyId: string;
    chapterId: string;
    text: string;
    parentId?: string | null;
};

export const addComment = async (commentData: AddCommentData): Promise<Comment> => {
    const response = await api.post('/comments', commentData);
    return response.data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
};