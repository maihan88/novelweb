

import React, { createContext, useContext, ReactNode, useCallback, useState } from 'react';
import { Comment } from '../types';
import * as commentService from '../services/commentService.ts';

interface CommentContextType {
  getCommentsForChapter: (storyId: string, chapterId: string) => Promise<Comment[]>;
  addCommentToChapter: (commentData: Omit<Comment, 'id' | '_id' | 'timestamp'>) => Promise<Comment>;
  loading: boolean;
  error: string | null;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCommentsForChapter = useCallback(async (storyId: string, chapterId: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with API call when backend is ready
      // const comments = await commentService.getComments(storyId, chapterId);
      // return comments;
      console.warn(`[CommentContext] Bỏ qua gọi API, trả về mảng rỗng cho bình luận của chương ${chapterId}.`);
      return [];
    } catch (err: any) {
      console.error(`[CommentContext] Lỗi khi lấy bình luận cho chương ${chapterId}.`, err);
      setError(err.message || 'Failed to fetch comments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addCommentToChapter = useCallback(async (commentData: Omit<Comment, 'id' | '_id' | 'timestamp'>) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with API call when backend is ready
      // const newComment = await commentService.addComment(commentData);
      
      // Mock implementation
      const newComment: Comment = {
        ...commentData,
        id: `comment-${Date.now()}`,
        _id: `comment-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      console.warn(`[CommentContext] Bỏ qua gọi API, giả lập thêm bình luận.`, newComment);
      return newComment;
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  

  const value = { getCommentsForChapter, addCommentToChapter, loading, error };

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentProvider');
  }
  return context;
};
