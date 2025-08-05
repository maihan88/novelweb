const mongoose = require('mongoose'); // <-- Đảm bảo bạn đã import mongoose
const Comment = require('../models/commentModel');

// @desc    Lấy tất cả bình luận cho một chương và phân cấp chúng
// @route   GET /api/comments
// @access  Public
exports.getCommentsForChapter = async (req, res) => {
    try {
        const { storyId, chapterId } = req.query;
        if (!storyId || !chapterId) {
            return res.status(400).json({ message: 'Thiếu thông tin truyện hoặc chương' });
        }
        const comments = await Comment.find({ storyId, chapterId }).sort({ timestamp: 'asc' });

        const commentMap = {};
        const rootComments = [];

        comments.forEach(comment => {
            const commentJSON = comment.toJSON();
            commentJSON.replies = [];
            commentMap[comment.id] = commentJSON;
        });

        Object.values(commentMap).forEach(comment => {
            if (comment.parentId && commentMap[comment.parentId]) {
                commentMap[comment.parentId].replies.push(comment);
            } else {
                rootComments.push(comment);
            }
        });

        res.json(rootComments);
    } catch (error) {
        console.error('Lỗi khi lấy bình luận:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Tạo một bình luận mới
// @route   POST /api/comments
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const { storyId, chapterId, text, parentId } = req.body;
        const { _id: userId, username } = req.user;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Nội dung không được để trống' });
        }

        // Kiểm tra parentId nếu có
        if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
            return res.status(400).json({ message: 'ID bình luận cha không hợp lệ' });
        }

        const newComment = new Comment({
            storyId,
            chapterId,
            text,
            user: userId,
            username,
            parentId: parentId || null,
        });

        const savedComment = await newComment.save();
        res.status(201).json(savedComment);
    } catch (error) {
        console.error('Lỗi khi tạo bình luận:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Xóa một bình luận (và các trả lời của nó)
// @route   DELETE /api/comments/:id
// @access  Private/Admin
exports.deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: 'ID bình luận không hợp lệ' });
        }

        const commentsToDelete = [commentId];
        const findReplies = async (id) => {
            const replies = await Comment.find({ parentId: id });
            for (const reply of replies) {
                commentsToDelete.push(reply._id);
                await findReplies(reply._id);
            }
        };

        await findReplies(commentId);
        
        await Comment.deleteMany({ _id: { $in: commentsToDelete } });

        res.json({ message: 'Bình luận và các trả lời đã được xóa' });
    } catch (error) {
        console.error('Lỗi khi xóa bình luận:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};