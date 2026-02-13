const express = require('express');
const router = express.Router();
const {
    getAllStories,
    getStoryById,
    createStory,
    updateStory,
    deleteStory,
    addVolume,
    updateVolume, // <--- Đã thêm
    addChapter,
    updateChapter,
    deleteChapter,
    getBannerStories,
    updateStoryBannerConfig,
    getChapterContent, 
    incrementChapterView,
    reorderVolumes,
    getDashboardStats
} = require('../controllers/storyController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

router.get('/banner/list', getBannerStories);

// Route lấy thống kê
router.get('/admin/stats', protect, admin, getDashboardStats);

// Public
router.get('/', getAllStories);
router.get('/:id', getStoryById);

// Thêm optionalAuth
router.get('/:id/chapters/:chapterId', optionalAuth, getChapterContent);
router.post('/:id/chapters/:chapterId/view', incrementChapterView);

// Admin
router.post('/', protect, admin, createStory);
router.put('/:id', protect, admin, updateStory);
router.delete('/:id', protect, admin, deleteStory);
router.put('/:id/banner', protect, admin, updateStoryBannerConfig);

// Volumes
router.post('/:id/volumes', protect, admin, addVolume);
router.put('/:id/volumes/reorder', protect, admin, reorderVolumes);
router.put('/:id/volumes/:volumeId', protect, admin, updateVolume); // <--- Đã thêm route này

// Chapters
router.post('/:id/volumes/:volumeId/chapters', protect, admin, addChapter);
router.put('/:id/volumes/:volumeId/chapters/:chapterId', protect, admin, updateChapter); 
router.delete('/:id/volumes/:volumeId/chapters/:chapterId', protect, admin, deleteChapter);

module.exports = router;