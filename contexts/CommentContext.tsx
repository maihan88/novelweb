
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.tsx';
import { Comment } from '../types';

type CommentsStore = Record<string, Comment[]>; // Key: `${storyId}-${chapterId}`

interface CommentContextType {
  getCommentsForChapter: (storyId: string, chapterId: string) => Comment[];
  addCommentToChapter: (storyId: string, chapterId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comments, setComments] = useLocalStorage<CommentsStore>('comments', {});

  const getCommentsForChapter = useCallback((storyId: string, chapterId: string) => {
    const key = `${storyId}-${chapterId}`;
    return comments[key] || [];
  }, [comments]);

  const addCommentToChapter = useCallback((storyId: string, chapterId: string, commentData: Omit<Comment, 'id' | 'timestamp'>) => {
    const key = `${storyId}-${chapterId}`;
    const newComment: Comment = {
      ...commentData,
      id: `comment-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    setComments(prev => {
      const existingComments = prev[key] || [];
      return {
        ...prev,
        [key]: [...existingComments, newComment]
      };
    });
  }, [setComments]);

  const value = { getCommentsForChapter, addCommentToChapter };

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