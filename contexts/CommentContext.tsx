import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Comment } from '../types';
import { useAuth } from './AuthContext'; // Cần AuthContext để lấy token

interface CommentContextType {
  comments: Comment[];
  loading: boolean;
  fetchComments: (chapterId: string) => Promise<void>;
  addComment: (chapterId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3001/api';

export const CommentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth(); // Lấy token từ AuthContext

  const fetchComments = useCallback(async (chapterId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data: Comment[] = await response.json();
      setComments(data);
    } catch (error) {
      console.error(error);
      setComments([]); // Xóa comment cũ nếu fetch lỗi
    } finally {
      setLoading(false);
    }
  }, []);

  const addComment = useCallback(async (chapterId: string, content: string) => {
    if (!token) throw new Error('You must be logged in to comment.');
    
    const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to post comment');
    const newComment: Comment = await response.json();
    setComments(prev => [newComment, ...prev]);
  }, [token]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!token) throw new Error('You must be logged in to delete comments.');

    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    setComments(prev => prev.filter(c => c.id !== commentId));
  }, [token]);

  return (
    <CommentContext.Provider value={{ comments, loading, fetchComments, addComment, deleteComment }}>
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
