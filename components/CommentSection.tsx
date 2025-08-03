import React, { useEffect, useState } from 'react';
import { useComments } from '../contexts/CommentContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface CommentSectionProps {
  chapterId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ chapterId }) => {
  const { comments, loading, fetchComments, addComment, deleteComment } = useComments();
  const { isAuthenticated, user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (chapterId) {
      fetchComments(chapterId);
    }
  }, [chapterId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment(chapterId, newComment);
      setNewComment('');
    } catch (error) {
      console.error(error);
      alert('Đã có lỗi xảy ra khi đăng bình luận.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
        try {
            await deleteComment(commentId);
        } catch (error) {
            console.error(error);
            alert('Đã có lỗi xảy ra khi xóa bình luận.');
        }
    }
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Bình luận</h3>
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            className="w-full p-3 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={3}
            placeholder="Viết bình luận của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
          </button>
        </form>
      ) : (
        <p className="text-center p-4 border-dashed border-2 rounded-md bg-gray-100 dark:bg-gray-800">
          Vui lòng <a href="/login" className="text-blue-500 hover:underline">đăng nhập</a> để bình luận.
        </p>
      )}

      <div className="space-y-4">
        {loading ? (
          <LoadingSpinner />
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">{comment.author.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                    </p>
                </div>
                {isAuthenticated && user?.id === comment.author.userId && (
                    <button onClick={() => handleDelete(comment.id)} className="text-red-500 hover:text-red-700 text-sm">Xóa</button>
                )}
              </div>
              <p className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
