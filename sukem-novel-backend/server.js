const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
try {
    connectDB();
} catch (error) {
    console.log('MongoDB connection failed, running without database...');
}

const app = express();

// --- BẮT ĐẦU THAY ĐỔI CORS ---
// Danh sách các domain được phép truy cập
const allowedOrigins = [
    'https://novelweb-phi.vercel.app', // Domain frontend của bạn trên Vercel
    'http://localhost:5173' // Dành cho môi trường phát triển local
];

const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép các request không có origin (như Postman, mobile apps) hoặc từ các domain trong danh sách
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cors(corsOptions)); // <-- SỬ DỤNG CẤU HÌNH MỚI
// --- KẾT THÚC THAY ĐỔI CORS ---

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Sukem Novel API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
