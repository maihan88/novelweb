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
    getChapterContent, 
    incrementChapterView,
    reorderVolumes
} = require('../controllers/storyController');
// Import thêm optionalAuth
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

router.get('/banner/list', getBannerStories);

// Public
router.get('/', getAllStories);
router.get('/:id', getStoryById);

// --- SỬA Ở ĐÂY ---
// Thêm optionalAuth để Controller biết ai đang đọc (Khách hay Admin)
router.get('/:id/chapters/:chapterId', optionalAuth, getChapterContent);
// -----------------

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
router.put('/:id/volumes/:volumeId/chapters/:chapterId', protect, admin, updateChapter); 
router.delete('/:id/volumes/:volumeId/chapters/:chapterId', protect, admin, deleteChapter);

module.exports = router;
