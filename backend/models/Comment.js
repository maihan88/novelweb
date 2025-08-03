import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    chapterId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    author: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
