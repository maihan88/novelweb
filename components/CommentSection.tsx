import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Comment } from '../types';
import { useComments } from '../contexts/CommentContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import CommentItem, { CommentForm } from './CommentItem.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';

interface CommentSectionProps {
  storyId: string;
  chapterId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ storyId, chapterId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const { getCommentsForChapter, addCommentToChapter, deleteCommentFromChapter, loading, error } = useComments();
  const { currentUser } = useAuth();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    const fetchedComments = await getCommentsForChapter(storyId, chapterId);
    setComments(fetchedComments);
  }, [getCommentsForChapter, storyId, chapterId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (text: string, parentId: string | null = null) => {
    try {
        await addCommentToChapter({ storyId, chapterId, text, parentId });
        fetchComments();
    } catch (err) {
        console.error("Lỗi thêm comment:", err);
        alert("Thêm bình luận thất bại.");
    }
  };

  const handleDeleteRequest = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowConfirmDelete(true);
  };

  const handleConfirmDeleteComment = async () => {
    if (commentToDelete) {
      try {
          await deleteCommentFromChapter(commentToDelete);
          fetchComments();
      } catch (err) {
          console.error("Lỗi xóa comment:", err);
          alert("Xóa bình luận thất bại.");
      }
    }
  };

  return (
    <div className="mt-12 text-sukem-text">
      <h2 className="text-2xl font-bold font-serif mb-4 text-sukem-text border-b border-sukem-border pb-2">Bình luận</h2>
      
      {/* Form thêm bình luận hoặc thông báo đăng nhập */}
      {currentUser ? (
        <CommentForm onSubmit={(text) => handleAddComment(text)} />
      ) : (
        <p className="p-4 bg-sukem-card rounded-md text-center text-sm text-sukem-text-muted border border-sukem-border border-dashed">
          Vui lòng <Link to="/login" className="font-semibold text-sukem-primary hover:underline">đăng nhập</Link> để bình luận.
        </p>
      )}

      {loading && <div className="py-8"><LoadingSpinner /></div>}
      {error && !loading && <p className="text-red-500 text-center py-8">{error}</p>}

      {/* Danh sách bình luận */}
      <div className="mt-8 space-y-6">
        {!loading && comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={(parentId, text) => handleAddComment(text, parentId)}
            onDelete={handleDeleteRequest}
          />
        ))}
        {!loading && comments.length === 0 && <p className="text-center text-sukem-text-muted py-8 italic">Chưa có bình luận nào.</p>}
      </div>

       <ConfirmationModal
          isOpen={showConfirmDelete}
          onClose={() => {
              setShowConfirmDelete(false);
              setCommentToDelete(null);
          }}
          onConfirm={handleConfirmDeleteComment}
          title="Xác nhận xóa bình luận"
          message="Bạn có chắc chắn muốn xóa bình luận này và tất cả các trả lời của nó không? Hành động này không thể hoàn tác."
          confirmText="Xóa bình luận"
          isDestructive={true}
       />
    </div>
  );
};

export default CommentSection;