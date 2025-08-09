const express = require('express');
const router = express.Router();
const {
    getAllStories,
    getStoryById,
    createStory,
    updateStory,
    deleteStory,
    addRating,
    addVolume,
    updateVolume,
    deleteVolume,
    addChapter,
    updateChapter,
    deleteChapter,
    incrementChapterView,
} = require('../controllers/storyController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllStories);
router.get('/:id', getStoryById);
router.post('/:id/chapters/:chapterId/view', incrementChapterView);

// Protected routes
router.post('/:id/rating', protect, addRating);

// Admin routes
router.post('/', protect, admin, createStory);
router.put('/:id', protect, admin, updateStory);
router.delete('/:id', protect, admin, deleteStory);

// Volume management (Admin)
router.post('/:id/volumes', protect, admin, addVolume);
router.put('/:id/volumes/:volumeId', protect, admin, updateVolume);
router.delete('/:id/volumes/:volumeId', protect, admin, deleteVolume);

// Chapter management (Admin)
router.post('/:id/volumes/:volumeId/chapters', protect, admin, addChapter);
router.put('/:id/volumes/:volumeId/chapters/:chapterId', protect, admin, updateChapter);
router.delete('/:id/volumes/:volumeId/chapters/:chapterId', protect, admin, deleteChapter);

module.exports = router; 