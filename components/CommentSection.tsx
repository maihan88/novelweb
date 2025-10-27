// src/components/CommentSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // <--- THÊM IMPORT
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
  // State cho modal xác nhận xóa
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Hàm tải comments
  const fetchComments = useCallback(async () => {
    const fetchedComments = await getCommentsForChapter(storyId, chapterId);
    setComments(fetchedComments);
  }, [getCommentsForChapter, storyId, chapterId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Hàm thêm comment
  const handleAddComment = async (text: string, parentId: string | null = null) => {
    try {
        await addCommentToChapter({ storyId, chapterId, text, parentId });
        fetchComments(); // Tải lại danh sách comment
    } catch (err) {
        console.error("Lỗi thêm comment:", err);
        alert("Thêm bình luận thất bại."); // Thông báo lỗi
    }
  };

  // Hàm MỞ modal xác nhận xóa
  const handleDeleteRequest = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowConfirmDelete(true);
  };

  // Hàm XÁC NHẬN xóa comment
  const handleConfirmDeleteComment = async () => {
    if (commentToDelete) {
      try {
          await deleteCommentFromChapter(commentToDelete);
          fetchComments(); // Tải lại comment sau khi xóa thành công
      } catch (err) {
          console.error("Lỗi xóa comment:", err);
          alert("Xóa bình luận thất bại."); // Thông báo lỗi đơn giản
      }
    }
    // Modal tự đóng khi confirm, không cần đóng ở đây
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold font-serif mb-4 text-slate-900 dark:text-white">Bình luận</h2>
      {/* Form thêm bình luận hoặc thông báo đăng nhập */}
      {currentUser ? (
        <CommentForm onSubmit={(text) => handleAddComment(text)} />
      ) : (
        <p className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-center text-sm text-slate-600 dark:text-slate-300">
          Vui lòng <Link to="/login" className="font-semibold text-orange-600 dark:text-amber-400 hover:underline">đăng nhập</Link> để bình luận.
        </p>
      )}

      {/* Loading và Error states */}
      {loading && <div className="py-8"><LoadingSpinner /></div>}
      {error && !loading && <p className="text-red-500 dark:text-red-400 text-center py-8">{error}</p>}

      {/* Danh sách bình luận */}
      <div className="mt-8 space-y-6">
        {!loading && comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={(parentId, text) => handleAddComment(text, parentId)}
            onDelete={handleDeleteRequest} // Truyền hàm mở modal (đồng bộ)
          />
        ))}
        {/* Thông báo khi không có bình luận */}
        {!loading && comments.length === 0 && <p className="text-center text-slate-500 dark:text-stone-400 py-8 italic">Chưa có bình luận nào.</p>}
      </div>

       {/* Modal xác nhận xóa bình luận */}
       <ConfirmationModal
          isOpen={showConfirmDelete}
          onClose={() => {
              setShowConfirmDelete(false);
              setCommentToDelete(null); // Reset state khi đóng modal
          }}
          onConfirm={handleConfirmDeleteComment} // Hàm xóa thực sự (bất đồng bộ)
          title="Xác nhận xóa bình luận"
          message="Bạn có chắc chắn muốn xóa bình luận này và tất cả các trả lời của nó không? Hành động này không thể hoàn tác."
          confirmText="Xóa bình luận"
          isDestructive={true} // Nút confirm màu đỏ
       />
    </div>
  );
};

export default CommentSection;
