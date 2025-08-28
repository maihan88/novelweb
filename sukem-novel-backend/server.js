const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database (optional for now)
try {
    connectDB();
} catch (error) {
    console.log('MongoDB connection failed, running without database...');
}

const app = express();

// CORS configuration - SỬA PHẦN NÀY
const corsOptions = {
    origin: [
        'https://novelweb-phi.vercel.app', // Frontend production URL
        'http://localhost:3000',           // Frontend development URL
        'http://localhost:5173'            // Vite dev server
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions)); // Thay đổi từ cors() thành cors(corsOptions)
app.use(express.json());
// Debug middleware để log mọi request
app.use((req, res, next) => {
    console.log('\n=== INCOMING REQUEST ===');
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('========================\n');
    next();
});

// Error handling middleware - cập nhật để log chi tiết hơn
app.use((err, req, res, next) => {
    console.error('\n=== UNHANDLED ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Request URL:', req.url);
    console.error('Request method:', req.method);
    console.error('Request body:', req.body);
    console.error('=====================\n');
    
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Origin:', req.get('Origin'));
    console.log('Headers:', req.headers);
    
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    
    next();
});

// Routes
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Sukem Novel API' });
});

// Test routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'API test route working!' });
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
