

import React, { useState, useEffect, useCallback } from 'react';
import { useComments } from '../contexts/CommentContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import { Comment } from '../types.ts';
import { Link } from 'react-router-dom';

interface CommentSectionProps {
  storyId: string;
  chapterId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ storyId, chapterId }) => {
  const { getCommentsForChapter, addCommentToChapter, error: contextError } = useComments();
  const { currentUser } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [formError, setFormError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setInitialLoading(true);
    const fetchedComments = await getCommentsForChapter(storyId, chapterId);
    setComments(fetchedComments);
    setInitialLoading(false);
  }, [getCommentsForChapter, storyId, chapterId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setFormError('Bạn cần đăng nhập để bình luận.');
      return;
    }
    if (!commentText.trim()) {
      setFormError('Vui lòng nhập nội dung bình luận.');
      return;
    }
    setFormError('');
    setIsPosting(true);
    
    try {
      const newComment = await addCommentToChapter({ 
        storyId, 
        chapterId, 
        userId: currentUser.id,
        username: currentUser.username,
        text: commentText.trim() 
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      setFormError('Gửi bình luận thất bại. Vui lòng thử lại.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold font-serif mb-6 text-slate-900 dark:text-white">Bình luận</h2>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
        {currentUser ? (
          <form onSubmit={handleAddComment} className="space-y-4">
            <h3 className="font-semibold text-lg">Để lại bình luận với tư cách {currentUser.username}</h3>
            <div>
              <label htmlFor="comment-text" className="sr-only">Bình luận</label>
              <textarea
                id="comment-text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Viết bình luận của bạn ở đây..."
                rows={4}
                required
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-cyan-500 transition"
              ></textarea>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="text-right">
              <button
                type="submit"
                disabled={isPosting}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPosting ? 'Đang gửi...' : 'Gửi bình luận'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center p-4">
            <p className="text-slate-600 dark:text-slate-300">
              Vui lòng <Link to="/login" className="text-cyan-500 font-semibold hover:underline">đăng nhập</Link> hoặc <Link to="/register" className="text-cyan-500 font-semibold hover:underline">đăng ký</Link> để để lại bình luận.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {initialLoading ? (
          <div className="text-center py-4"><LoadingSpinner /></div>
        ) : contextError && comments.length === 0 ? (
          <div className="text-center py-4 text-red-500">{contextError}</div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-slate-800 dark:text-slate-100">{comment.username}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(comment.timestamp).toLocaleString('vi-VN')}
                </p>
              </div>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
