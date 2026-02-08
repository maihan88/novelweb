import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';
import { TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';

// --- COMPONENT COMMENT FORM ---
export const CommentForm: React.FC<{
  onSubmit: (text: string) => Promise<void>;
  buttonText?: string;
  onCancel?: () => void;
  initialText?: string;
}> = ({ onSubmit, buttonText = 'Gửi bình luận', onCancel, initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
        await onSubmit(text);
        setText('');
        onCancel?.();
    } catch (error) {
        console.error("Lỗi gửi bình luận/trả lời:", error);
        alert("Gửi bình luận thất bại.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        // Input: bg-sukem-bg
        className="text-sm w-full p-2 border rounded-lg bg-sukem-bg border-sukem-border focus:ring-2 focus:ring-sukem-primary text-sukem-text placeholder-sukem-text-muted transition-colors outline-none"
        placeholder="Viết bình luận của bạn..."
        rows={3}
        required
      />
      <div className="flex items-center gap-2 mt-2">
        <button type="submit" disabled={isSubmitting || !text.trim()} className="px-4 py-2 bg-sukem-primary text-white font-semibold rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity text-sm shadow-sm">
          {isSubmitting ? 'Đang gửi...' : buttonText}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-sukem-card border border-sukem-border text-sukem-text rounded hover:bg-sukem-bg transition-colors text-sm">
            Hủy
          </button>
        )}
      </div>
    </form>
  );
};

// --- INTERFACE PROPS CHO COMMENT ITEM ---
interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, text: string) => Promise<void>;
  onDelete: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, onDelete }) => {
  const { currentUser } = useAuth();
  const [isReplying, setIsReplying] = useState(false);

  const handleReplySubmit = async (text: string) => {
    await onReply(comment.id, text);
    setIsReplying(false);
  };

  const formatTimestamp = (isoString: string) => {
      try {
          const date = new Date(isoString);
          return date.toLocaleString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
          });
      } catch {
          return 'Thời gian không hợp lệ';
      }
  };

  return (
    <div className="flex flex-col animate-fade-in">
        {/* Phần comment chính */}
        <div className="flex gap-3">
            {/* Avatar Placeholder: Dùng màu secondary */}
            <div className="w-10 h-10 rounded-full bg-sukem-secondary/20 flex-shrink-0 flex items-center justify-center text-sukem-secondary font-bold text-lg border border-sukem-secondary/30">
                {comment.username ? comment.username.charAt(0).toUpperCase() : '?'}
            </div>
            
            {/* Nội dung comment */}
            <div className="flex-grow">
                {/* Bubble: bg-sukem-bg */}
                <div className="bg-sukem-bg rounded-2xl rounded-tl-none p-3 border border-sukem-border shadow-sm">
                    <p className="font-semibold text-sm text-sukem-text">{comment.username}</p>
                    <p className="mt-1 text-sm text-sukem-text whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3 text-xs text-sukem-text-muted mt-1.5 pl-1">
                    <span>{formatTimestamp(comment.timestamp)}</span>
                    
                    {currentUser && (
                        <button onClick={() => setIsReplying(!isReplying)} className="font-semibold hover:underline flex items-center gap-1 transition-colors text-sukem-text-muted hover:text-sukem-accent">
                            <ArrowUturnLeftIcon className="h-3.5 w-3.5" /> Trả lời
                        </button>
                    )}
                    
                    {currentUser?.role === 'admin' && (
                        <button onClick={() => onDelete(comment.id)} className="font-semibold hover:underline text-red-500/70 flex items-center gap-1 transition-colors hover:text-red-600">
                            <TrashIcon className="h-3.5 w-3.5" /> Xóa
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Form trả lời */}
        {isReplying && (
            <div className="ml-12 mt-3 border-l-2 border-sukem-border pl-4 py-2">
                <CommentForm
                    onSubmit={handleReplySubmit}
                    buttonText="Gửi trả lời"
                    onCancel={() => setIsReplying(false)}
                />
            </div>
        )}

        {/* Phần hiển thị các comment trả lời (đệ quy) */}
        {comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-4 pl-4 border-l-2 border-sukem-border space-y-4">
                {comment.replies.map(reply => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        onReply={onReply}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        )}
    </div>
  );
};

export default CommentItem;