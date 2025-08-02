

import React, { useState } from 'react';
import { useComments } from '../contexts/CommentContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Link } from 'react-router-dom';

interface CommentSectionProps {
  storyId: string;
  chapterId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ storyId, chapterId }) => {
  const { getCommentsForChapter, addCommentToChapter } = useComments();
  const { currentUser } = useAuth();
  const comments = getCommentsForChapter(storyId, chapterId);
  
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Bạn phải đăng nhập để bình luận.');
      return;
    }
    if (!commentText.trim()) {
      setError('Vui lòng nhập nội dung bình luận.');
      return;
    }
    setError('');
    addCommentToChapter(storyId, chapterId, { 
      userId: currentUser.id, 
      username: currentUser.username, 
      text: commentText.trim() 
    });
    setCommentText('');
  };

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold font-serif mb-6 text-slate-900 dark:text-white">Bình luận</h2>
      
      {/* Form to add a new comment */}
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
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-cyan-500 transition"
              ></textarea>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="text-right">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-md hover:opacity-90 transition-opacity"
              >
                Gửi bình luận
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300">
                Vui lòng <Link to="/login" className="text-cyan-500 hover:underline font-semibold">đăng nhập</Link> để để lại bình luận.
            </p>
          </div>
        )}
      </div>

      {/* List of comments */}
      <div className="space-y-6">
        {comments.length > 0 ? (
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