const express = require('express');
const router = express.Router();
const { uploadImage, upload } = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/authMiddleware');

// Upload route
router.post('/', protect, admin, upload, uploadImage);

module.exports = router; 