import React, { useState } from 'react';
import { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';
import { TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';

export const CommentForm: React.FC<{
  onSubmit: (text: string) => Promise<void>;
  buttonText?: string;
  onCancel?: () => void;
}> = ({ onSubmit, buttonText = 'Gửi bình luận', onCancel }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    await onSubmit(text);
    setIsSubmitting(false);
    setText('');
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="text- w-full p-2 border rounded bg-white dark:bg-stone-700 border-slate-300 dark:border-stone-600 focus:ring-2 focus:ring-orange-500"
        placeholder="Viết bình luận của bạn..."
        rows={3}
        required
      />
      <div className="flex items-center gap-2 mt-2">
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-orange-400 dark:bg-amber-200/60 dark:hover:bg-amber-100/60 text-white font-semibold rounded hover:bg-orange-500 disabled:opacity-50">
          {isSubmitting ? 'Đang gửi...' : buttonText}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-orange-200 dark:bg-stone-600 rounded hover:bg-orange-300 dark:hover:bg-stone-400">
            Hủy
          </button>
        )}
      </div>
    </form>
  );
};


interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, text: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply, onDelete }) => {
  const { currentUser } = useAuth();
  const [isReplying, setIsReplying] = useState(false);

  const handleReplySubmit = async (text: string) => {
    await onReply(comment.id, text);
    setIsReplying(false);
  };

  return (
    <div className="flex flex-col">
        <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-300 dark:bg-stone-600 flex-shrink-0"></div>
            <div className="flex-grow">
                <div className="bg-orange-100 dark:bg-stone-800 rounded-lg p-3">
                    <p className="font-semibold text-stone-900 dark:text-white">{comment.username}</p>
                    <p className="text-slate-700 dark:text-stone-300 whitespace-pre-wrap">{comment.text}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-black-500 dark:text-stone-400 mt-1 pl-1">
                    <span>{new Date(comment.timestamp).toLocaleString()}</span>
                    {currentUser && (
                        <button onClick={() => setIsReplying(!isReplying)} className="font-semibold hover:underline flex items-center gap-1">
                            <ArrowUturnLeftIcon className="h-3 w-3" /> Trả lời
                        </button>
                    )}
                    {currentUser?.role === 'admin' && (
                        <button onClick={() => onDelete(comment.id)} className="font-semibold hover:underline text-red-500 flex items-center gap-1">
                            <TrashIcon className="h-3 w-3" /> Xóa
                        </button>
                    )}
                </div>
            </div>
        </div>
        
        {isReplying && (
            <div className="ml-12 pl-1 mt-2">
                <CommentForm onSubmit={handleReplySubmit} buttonText="Gửi trả lời" onCancel={() => setIsReplying(false)} />
            </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-4 pl-4 border-l-2 border-slate-200 dark:border-stone-700 space-y-4">
                {comment.replies.map(reply => (
                    <CommentItem key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} />
                ))}
            </div>
        )}
    </div>
  );
};

export default CommentItem;