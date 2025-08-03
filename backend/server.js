import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';

// Load biến môi trường từ file .env
dotenv.config();

// Import Middleware và Models
import authMiddleware from './middleware/auth.js';
import Story from './models/Story.js';
import User from './models/User.js';
import Comment from './models/Comment.js';

const app = express();
// Sử dụng các biến từ process.env
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!JWT_SECRET || !MONGO_URI) {
    console.error("FATAL ERROR: JWT_SECRET or MONGO_URI is not defined in .env file.");
    process.exit(1);
}

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB connected successfully.');
        
        // Tạo tài khoản admin mặc định nếu chưa tồn tại
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            await newAdmin.save();
            console.log('Default admin account created');
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));


// === API: AUTHENTICATION ===
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });
        if (await User.findOne({ username })) return res.status(409).json({ message: 'Username already exists.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ id: newUser._id, username: newUser.username, role: newUser.role });
    } catch (error) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const tokenPayload = { id: user._id, username: user.username, role: user.role };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: tokenPayload });
    } catch (error) { res.status(500).json({ message: 'Internal Server Error' }); }
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// === API: STORIES ===
app.get('/api/stories', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // 12 truyện mỗi trang
        const searchQuery = req.query.q || '';

        // Xây dựng query cho MongoDB
        const query = searchQuery ? {
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } }, // 'i' for case-insensitive
                { author: { $regex: searchQuery, $options: 'i' } },
            ]
        } : {};

        const stories = await Story.find(query)
            .sort({ lastUpdatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalStories = await Story.countDocuments(query);

        res.json({
            stories,
            currentPage: page,
            totalPages: Math.ceil(totalStories / limit),
            totalStories,
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/stories', authMiddleware, async (req, res) => {
    try {
        const newStory = new Story({ ...req.body, id: nanoid(10) });
        await newStory.save();
        res.status(201).json(newStory);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

app.put('/api/stories/:storyId', authMiddleware, async (req, res) => {
    const updatedStory = await Story.findOneAndUpdate({ id: req.params.storyId }, { ...req.body, lastUpdatedAt: new Date() }, { new: true });
    if (!updatedStory) return res.status(404).json({ message: 'Story not found' });
    res.json(updatedStory);
});

app.delete('/api/stories/:storyId', authMiddleware, async (req, res) => {
    const result = await Story.deleteOne({ id: req.params.storyId });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Story not found' });
    res.status(200).json({ message: 'Story deleted successfully.' });
});


// === API: VOLUMES ===
app.post('/api/stories/:storyId/volumes', authMiddleware, async (req, res) => {
    try {
        const { title } = req.body;
        const newVolume = { id: nanoid(10), title, chapters: [] };
        const result = await Story.updateOne({ id: req.params.storyId }, { $push: { volumes: newVolume }, $set: { lastUpdatedAt: new Date() } });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Story not found' });
        res.status(201).json(newVolume);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/stories/:storyId/volumes/:volumeId', authMiddleware, async (req, res) => {
    const result = await Story.updateOne({ id: req.params.storyId }, { $pull: { volumes: { id: req.params.volumeId } }, $set: { lastUpdatedAt: new Date() } });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Story not found' });
    if (result.modifiedCount === 0) return res.status(404).json({ message: 'Volume not found' });
    res.status(200).json({ message: 'Volume deleted successfully.' });
});


// === API: CHAPTERS ===
app.post('/api/stories/:storyId/volumes/:volumeId/chapters', authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;
        const newChapter = { id: nanoid(10), title, content, views: 0, createdAt: new Date() };
        const result = await Story.updateOne({ "volumes.id": req.params.volumeId }, { $push: { "volumes.$.chapters": newChapter }, $set: { lastUpdatedAt: new Date() } });
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Volume not found' });
        res.status(201).json(newChapter);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

app.put('/api/stories/:storyId/volumes/:volumeId/chapters/:chapterId', authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;
        const result = await Story.updateOne(
            { "volumes.chapters.id": req.params.chapterId },
            { $set: { "volumes.$[].chapters.$[c].title": title, "volumes.$[].chapters.$[c].content": content, lastUpdatedAt: new Date() } },
            { arrayFilters: [{ "c.id": req.params.chapterId }] }
        );
        if (result.matchedCount === 0) return res.status(404).json({ message: 'Chapter not found' });
        res.status(200).json({ message: 'Chapter updated successfully.' });
    } catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/stories/:storyId/volumes/:volumeId/chapters/:chapterId', authMiddleware, async (req, res) => {
    const result = await Story.updateOne({ "volumes.id": req.params.volumeId }, { $pull: { "volumes.$.chapters": { id: req.params.chapterId } }, $set: { lastUpdatedAt: new Date() } });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Volume not found' });
    if (result.modifiedCount === 0) return res.status(404).json({ message: 'Chapter not found' });
    res.status(200).json({ message: 'Chapter deleted successfully.' });
});


// === API: INTERACTIONS ===
app.post('/api/stories/:storyId/view', async (req, res) => {
    await Story.updateOne({ id: req.params.storyId }, { $inc: { views: 1 } });
    res.sendStatus(200);
});

app.post('/api/stories/:storyId/chapters/:chapterId/view', async (req, res) => {
    await Story.updateOne({ "volumes.chapters.id": req.params.chapterId }, { $inc: { "volumes.$[].chapters.$[c].views": 1 } }, { arrayFilters: [{ "c.id": req.params.chapterId }] });
    res.sendStatus(200);
});

app.post('/api/stories/:storyId/rate', authMiddleware, async (req, res) => {
    try {
        const story = await Story.findOne({ id: req.params.storyId });
        if (!story) return res.status(404).json({ message: 'Story not found.' });
        
        const { newRating, previousRating } = req.body;
        if (typeof newRating !== 'number' || newRating < 1 || newRating > 5) return res.status(400).json({ message: 'Invalid rating.' });

        const oldTotalRating = story.rating * story.ratingsCount;
        if (previousRating !== undefined) {
            story.rating = (oldTotalRating - previousRating + newRating) / story.ratingsCount;
        } else {
            story.ratingsCount += 1;
            story.rating = (oldTotalRating + newRating) / story.ratingsCount;
        }
        await story.save();
        res.status(200).json({ rating: story.rating, ratingsCount: story.ratingsCount });
    } catch (error) { res.status(500).json({ message: 'Internal Server Error' }); }
});


// === API: COMMENTS ===
app.get('/api/chapters/:chapterId/comments', async (req, res) => {
    const comments = await Comment.find({ chapterId: req.params.chapterId }).sort({ createdAt: -1 });
    res.json(comments);
});

app.post('/api/chapters/:chapterId/comments', authMiddleware, async (req, res) => {
    try {
        const newComment = new Comment({ chapterId: req.params.chapterId, content: req.body.content, author: { userId: req.user.id, username: req.user.username } });
        await newComment.save();
        res.status(201).json(newComment);
    } catch (error) { res.status(400).json({ message: error.message }); }
});

app.delete('/api/comments/:commentId', authMiddleware, async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    if (comment.author.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied.' });
    }
    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: 'Comment deleted successfully.' });
});


// --- Server Start ---
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
