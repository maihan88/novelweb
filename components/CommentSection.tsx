import React, { useState, useEffect, useCallback } from 'react';
import { Comment } from '../types';
import { useComments } from '../contexts/CommentContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import CommentItem, { CommentForm } from './CommentItem.tsx';

interface CommentSectionProps {
  storyId: string;
  chapterId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ storyId, chapterId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const { getCommentsForChapter, addCommentToChapter, deleteCommentFromChapter, loading, error } = useComments();
  const { currentUser } = useAuth();

  const fetchComments = useCallback(async () => {
    const fetchedComments = await getCommentsForChapter(storyId, chapterId);
    setComments(fetchedComments);
  }, [getCommentsForChapter, storyId, chapterId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (text: string, parentId: string | null = null) => {
    await addCommentToChapter({ storyId, chapterId, text, parentId });
    fetchComments(); // Tải lại danh sách bình luận sau khi thêm
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      await deleteCommentFromChapter(commentId);
      fetchComments(); // Tải lại danh sách bình luận sau khi xóa
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold font-serif mb-4">Bình luận</h2>
      {currentUser ? (
        <CommentForm onSubmit={(text) => handleAddComment(text)} />
      ) : (
        <p className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-center">
          Vui lòng <a href="/login" className="font-semibold text-indigo-600 hover:underline">đăng nhập</a> để bình luận.
        </p>
      )}

      {loading && <p>Đang tải bình luận...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <div className="mt-8 space-y-6">
        {comments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            onReply={(parentId, text) => handleAddComment(text, parentId)}
            onDelete={handleDeleteComment}
          />
        ))}
        {!loading && comments.length === 0 && <p className="text-center text-slate-500">Chưa có bình luận nào.</p>}
      </div>
    </div>
  );
};

export default CommentSection;