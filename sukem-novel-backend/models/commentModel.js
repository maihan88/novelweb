const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    storyId: { type: String, required: true, index: true },
    chapterId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    username: { type: String, required: true },
    // parentId: null nghĩa là bình luận gốc.
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

commentSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

module.exports = mongoose.model('Comment', commentSchema);