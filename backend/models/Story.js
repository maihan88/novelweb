import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const volumeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    chapters: [chapterSchema],
});

const storySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, index: true },
    author: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    status: { type: String, enum: ['ongoing', 'completed', 'dropped'], default: 'ongoing' },
    tags: [{ type: String, index: true }],
    volumes: [volumeSchema],
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
});

const Story = mongoose.model('Story', storySchema);
export default Story;
