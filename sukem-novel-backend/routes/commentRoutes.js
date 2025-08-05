const express = require('express');
const router = express.Router();
const { getCommentsForChapter, addComment, deleteComment } = require('../controllers/commentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getCommentsForChapter)
    .post(protect, addComment);

// Route để xóa một bình luận cụ thể bằng ID
router.route('/:id')
    .delete(protect, admin, deleteComment);

module.exports = router;