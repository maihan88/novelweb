const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS configuration
const corsOptions = {
    origin: [
        'https://novelweb-phi.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request Logger (Development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// Routes
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'success', message: 'Sukem Novel API is running' });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Đường dẫn không tồn tại' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 ERROR:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : 'REDACTED',
        path: req.url
    });

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi server nội bộ',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🌍 Chế độ: ${process.env.NODE_ENV || 'production'}`);
});