import jwt from 'jsonwebtoken';

// Lấy JWT_SECRET từ biến môi trường hoặc dùng một giá trị mặc định
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-that-is-long-and-random';

const authMiddleware = (req, res, next) => {
    // Lấy token từ header 'Authorization'
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Token thường có định dạng "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. Token format is invalid.' });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, JWT_SECRET);
        // Gắn thông tin người dùng đã giải mã vào request để các hàm xử lý sau có thể sử dụng
        req.user = decoded;
        next(); // Chuyển sang hàm xử lý tiếp theo
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

export default authMiddleware;
