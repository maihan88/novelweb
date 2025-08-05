const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware để bảo vệ các route yêu cầu đăng nhập
const protect = async (req, res, next) => {
    let token;

    // Đọc token từ header 'Authorization'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ header (loại bỏ 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token để lấy userId
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tìm người dùng trong database bằng userId từ token
            // Gắn đối tượng user vào request để các controller sau có thể sử dụng
            req.user = await User.findById(decoded.userId).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Không được phép, người dùng không tồn tại' });
            }

            next(); // Chuyển sang middleware hoặc controller tiếp theo
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Không được phép, token không hợp lệ' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Không được phép, không có token' });
    }
};

// Middleware để kiểm tra quyền admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Không được phép, yêu cầu quyền admin' });
    }
};

module.exports = { protect, admin };