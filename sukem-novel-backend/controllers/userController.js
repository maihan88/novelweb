// maihan88/novelweb/novelweb-30378715fdd33fd98f7c1318544ef93eab22c598/sukem-novel-backend/controllers/userController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Hàm trợ giúp để tạo token
const generateToken = (userId, username, role) => {
    return jwt.sign({ userId, username, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Đăng ký người dùng mới
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        const user = await User.create({ username, password });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                role: user.role,
                favorites: [],
                bookmarks: {},
                ratedStories: {}
            });
        } else {
            res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Đăng nhập người dùng
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        // Lấy tất cả thông tin người dùng, bao gồm cả preferences
        const user = await User.findOne({ username });

        if (user && (await user.comparePassword(password))) {
            const token = generateToken(user._id, user.username, user.role);

            // Trả về đầy đủ thông tin để Frontend sync ngay khi login
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                token: token,
                favorites: user.favorites || [],
                bookmarks: user.bookmarks || {},
                ratedStories: user.ratedStories || {},
            });
        } else {
            res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Đăng xuất người dùng
// @route   POST /api/users/logout
// @access  Public
exports.logoutUser = (req, res) => {
    res.status(200).json({ message: 'Đăng xuất thành công' });
};

// @desc    Lấy thông tin cá nhân
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                favorites: user.favorites,
                bookmarks: user.bookmarks,
                ratedStories: user.ratedStories,
            });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cập nhật thông tin cá nhân (chỉ username/password)
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.username = req.body.username || user.username;
            if (req.body.password) {
                user.password = req.body.password;
            }
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                role: updatedUser.role,
            });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user preferences (favorites, full bookmarks map, etc.)
// @route   PUT /api/users/preferences
// @access  Private
exports.updateUserPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            if (req.body.favorites !== undefined) user.favorites = req.body.favorites;
            
            if (req.body.bookmarks !== undefined) user.bookmarks = req.body.bookmarks;
            
            if (req.body.ratedStories !== undefined) user.ratedStories = req.body.ratedStories;

            const updatedUser = await user.save();
            res.json({
                favorites: updatedUser.favorites,
                bookmarks: updatedUser.bookmarks,
                ratedStories: updatedUser.ratedStories,
            });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update reading progress for a specific story (Lightweight)
// @route   PUT /api/users/progress
// @access  Private
exports.updateReadingProgress = async (req, res) => {
    const { storyId, chapterId, progress } = req.body;

    if (!storyId || !chapterId) {
        return res.status(400).json({ message: 'Thiếu thông tin storyId hoặc chapterId' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const safeProgress = typeof progress === 'number' ? progress : 0;

        user.bookmarks.set(storyId, {
            chapterId,
            progress: safeProgress, 
            lastRead: new Date()
        });

        await user.save();
        
        res.status(200).json(user.bookmarks);
    } catch (error) {
        console.error("Error syncing progress:", error);
        res.status(500).json({ message: error.message });
    }
};