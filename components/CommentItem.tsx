import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <-- THÊM IMPORT LINK//
import { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';
import { TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';

// --- COMPONENT COMMENT FORM (không đổi) ---
export const CommentForm: React.FC<{
  onSubmit: (text: string) => Promise<void>; // Hàm submit vẫn là async
  buttonText?: string;
  onCancel?: () => void;
  initialText?: string; // Thêm initialText để hỗ trợ sửa comment sau này (nếu cần)
}> = ({ onSubmit, buttonText = 'Gửi bình luận', onCancel, initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
        await onSubmit(text);
        setText(''); // Chỉ reset text nếu submit thành công
        onCancel?.(); // Gọi onCancel sau khi thành công
    } catch (error) {
        console.error("Lỗi gửi bình luận/trả lời:", error);
        alert("Gửi bình luận thất bại."); // Thông báo lỗi
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="text-sm w-full p-2 border rounded bg-white dark:bg-stone-700 border-slate-300 dark:border-stone-600 focus:ring-2 focus:ring-orange-500 dark:focus:ring-amber-500 dark:text-white placeholder-slate-400 dark:placeholder-stone-500" // Thêm dark mode text/placeholder
        placeholder="Viết bình luận của bạn..."
        rows={3}
        required
      />
      <div className="flex items-center gap-2 mt-2">
        <button type="submit" disabled={isSubmitting || !text.trim()} className="px-4 py-2 bg-orange-500 dark:bg-amber-600 text-white font-semibold rounded hover:bg-orange-600 dark:hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"> {/* Thêm dark mode bg, hover, disabled style */}
          {isSubmitting ? 'Đang gửi...' : buttonText}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-stone-600 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-stone-500 transition-colors text-sm"> {/* Thêm dark mode style */}
            Hủy
          </button>
        )}
      </div>
    </form>
  );
};
// --- KẾT THÚC COMMENT FORM ---


// --- INTERFACE PROPS CHO COMMENT ITEM ---
interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, text: string) => Promise<void>; // Hàm trả lời vẫn là async
  onDelete: (commentId: string) => void; // <--- SỬA: Hàm onDelete là đồng bộ (chỉ mở modal)
}
// --- KẾT THÚC INTERFACE ---

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, onDelete }) => {
  const { currentUser } = useAuth();
  const [isReplying, setIsReplying] = useState(false);

  // Hàm xử lý submit trả lời (không đổi)
  const handleReplySubmit = async (text: string) => {
    await onReply(comment.id, text);
    setIsReplying(false); // Tự đóng form trả lời sau khi gửi thành công
  };

  // Hàm định dạng thời gian (ví dụ đơn giản)
  const formatTimestamp = (isoString: string) => {
      try {
          const date = new Date(isoString);
          return date.toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
          });
      } catch {
          return 'Thời gian không hợp lệ';
      }
  };


  return (
    <div className="flex flex-col animate-fade-in"> {/* Thêm hiệu ứng fade-in nhẹ */}
        {/* Phần comment chính */}
        <div className="flex gap-3">
            {/* Avatar Placeholder */}
            <div className="w-10 h-10 rounded-full bg-orange-200 dark:bg-stone-700 flex-shrink-0 flex items-center justify-center text-orange-600 dark:text-amber-400 font-semibold text-lg">
                {comment.username ? comment.username.charAt(0).toUpperCase() : '?'}
            </div>
            {/* Nội dung comment + Tên + Thời gian */}
            <div className="flex-grow">
                <div className="bg-orange-50 dark:bg-stone-800 rounded-lg p-3 border border-orange-100 dark:border-stone-700/50 shadow-sm">
                    {/* Tên người dùng */}
                    <p className="font-semibold text-sm text-stone-900 dark:text-white">{comment.username}</p>
                    {/* Nội dung text */}
                    <p className="mt-1 text-sm text-slate-700 dark:text-stone-300 whitespace-pre-wrap">{comment.text}</p>
                </div>
                {/* Actions: Thời gian, Trả lời, Xóa */}
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-stone-400 mt-1.5 pl-1">
                    {/* Thời gian */}
                    <span>{formatTimestamp(comment.timestamp)}</span>
                    {/* Nút Trả lời */}
                    {currentUser && ( // Chỉ hiện nút trả lời khi đã đăng nhập
                        <button onClick={() => setIsReplying(!isReplying)} className="font-semibold hover:underline flex items-center gap-1 transition-colors hover:text-orange-600 dark:hover:text-amber-400">
                            <ArrowUturnLeftIcon className="h-3.5 w-3.5" /> Trả lời
                        </button>
                    )}
                    {/* Nút Xóa (chỉ cho admin) */}
                    {currentUser?.role === 'admin' && (
                        <button onClick={() => onDelete(comment.id)} className="font-semibold hover:underline text-red-500 flex items-center gap-1 transition-colors hover:text-red-700">
                            <TrashIcon className="h-3.5 w-3.5" /> Xóa
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Form trả lời (hiện khi isReplying là true) */}
        {isReplying && (
            <div className="ml-12 mt-3 border-l-2 border-slate-200 dark:border-stone-700 pl-4 py-2"> {/* Thêm padding và border */}
                <CommentForm
                    onSubmit={handleReplySubmit}
                    buttonText="Gửi trả lời"
                    onCancel={() => setIsReplying(false)} // Nút Hủy để đóng form
                />
            </div>
        )}

        {/* Phần hiển thị các comment trả lời (đệ quy) */}
        {comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-4 pl-4 border-l-2 border-slate-200 dark:border-stone-700 space-y-4">
                {comment.replies.map(reply => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        onReply={onReply} // Truyền xuống onReply
                        onDelete={onDelete} // Truyền xuống onDelete
                    />
                ))}
            </div>
        )}
    </div>
  );
};

export default CommentItem;
