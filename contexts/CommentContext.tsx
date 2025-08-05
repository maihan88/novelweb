import React, { createContext, useContext, ReactNode, useCallback, useState } from 'react';
import { Comment } from '../types';
import * as commentService from '../services/commentService.ts';

// Định nghĩa kiểu dữ liệu cho việc tạo bình luận mới, khớp với commentService
type AddCommentData = Parameters<typeof commentService.addComment>[0];

interface CommentContextType {
  getCommentsForChapter: (storyId: string, chapterId: string) => Promise<Comment[]>;
  addCommentToChapter: (commentData: AddCommentData) => Promise<Comment>;
  deleteCommentFromChapter: (commentId: string) => Promise<void>;
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
      const comments = await commentService.getComments(storyId, chapterId);
      return comments;
    } catch (err: any) {
      console.error(`[CommentContext] Lỗi khi lấy bình luận cho chương ${chapterId}.`, err);
      setError(err.message || 'Không thể tải bình luận');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addCommentToChapter = useCallback(async (commentData: AddCommentData) => {
    setLoading(true);
    setError(null);
    try {
      const newComment = await commentService.addComment(commentData);
      return newComment;
    } catch (err: any) {
      setError(err.message || 'Không thể gửi bình luận');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const deleteCommentFromChapter = useCallback(async (commentId: string) => {
    setLoading(true);
    setError(null);
    try {
      await commentService.deleteComment(commentId);
    } catch (err: any) {
      setError(err.message || 'Không thể xóa bình luận');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = { getCommentsForChapter, addCommentToChapter, deleteCommentFromChapter, loading, error };

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