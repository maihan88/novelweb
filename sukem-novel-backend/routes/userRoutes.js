// maihan88/novelweb/novelweb-30378715fdd33fd98f7c1318544ef93eab22c598/sukem-novel-backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    updateUserPreferences // <-- Import hàm mới
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// --- THÊM ROUTE MỚI ---
router.put('/preferences', protect, updateUserPreferences);
// --- KẾT THÚC ---

module.exports = router;
