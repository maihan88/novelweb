const express = require('express');
const router = express.Router();
const {
    getAllStories,
    getStoryById,
    createStory,
    updateStory,
    deleteStory,
    addVolume,
    addChapter,
    updateChapter,
    deleteChapter,
    getBannerStories,
    updateStoryBannerConfig,
    getChapterContent, // Thêm hàm này
    incrementChapterView,
    reorderVolumes
} = require('../controllers/storyController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/banner/list', getBannerStories);

// Public
router.get('/', getAllStories);
router.get('/:id', getStoryById);
// API MỚI QUAN TRỌNG: Lấy nội dung chương
router.get('/:id/chapters/:chapterId', getChapterContent);
router.post('/:id/chapters/:chapterId/view', incrementChapterView);

// Admin
router.post('/', protect, admin, createStory);
router.put('/:id', protect, admin, updateStory);
router.delete('/:id', protect, admin, deleteStory);
router.put('/:id/banner', protect, admin, updateStoryBannerConfig);

// Volumes
router.post('/:id/volumes', protect, admin, addVolume);
router.put('/:id/volumes/reorder', protect, admin, reorderVolumes);

// Chapters
router.post('/:id/volumes/:volumeId/chapters', protect, admin, addChapter);
router.put('/:id/volumes/:volumeId/chapters/:chapterId', protect, admin, updateChapter); // URL cũ
router.delete('/:id/volumes/:volumeId/chapters/:chapterId', protect, admin, deleteChapter); // URL cũ

module.exports = router;
