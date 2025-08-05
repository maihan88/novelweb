const User = require('../models/userModel'); // <-- THÊM DÒNG NÀY
const jwt = require('jsonwebtoken');

// Hàm trợ giúp để tạo token
const generateToken = (userId, username, role, avatarUrl) => {
    return jwt.sign({ userId, username, role, avatarUrl }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Đăng ký người dùng mới
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
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
            avatarUrl: user.avatarUrl,
        });
    } else {
        res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
};

// @desc    Đăng nhập người dùng
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await user.comparePassword(password))) {
        const token = generateToken(user._id, user.username, user.role, user.avatarUrl);
        
        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            avatarUrl: user.avatarUrl,
            token: token
        });
    } else {
        res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
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
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            avatarUrl: user.avatarUrl,
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

// @desc    Cập nhật thông tin cá nhân
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
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
            avatarUrl: updatedUser.avatarUrl,
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

// @desc    Cập nhật avatar người dùng
// @route   PUT /api/users/profile/avatar
// @access  Private
exports.updateUserAvatar = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.avatarUrl = req.body.avatarUrl || user.avatarUrl;
        const updatedUser = await user.save();
        
        const token = generateToken(updatedUser._id, updatedUser.username, updatedUser.role, updatedUser.avatarUrl);

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
            token: token
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};