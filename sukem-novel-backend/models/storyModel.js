const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
}, { _id: false }); // Thêm dòng này để Mongoose không tự tạo _id cho chapter

const volumeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    chapters: [chapterSchema],
}, { _id: false }); // Thêm dòng này để Mongoose không tự tạo _id cho volume

const storySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    alias: [String], // SỬA TỪ `String` THÀNH `[String]` (một mảng các chuỗi)
    author: { type: String, required: true },
    description: String,
    coverImage: { type: String, required: true },
    tags: [String],
    status: { type: String, enum: ['Đang dịch', 'Hoàn thành'], default: 'Đang dịch' },
    volumes: [volumeSchema],
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    isHot: { type: Boolean, default: false },
    isInBanner: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
});

// Update lastUpdatedAt when story is modified
storySchema.pre('save', function(next) {
    if (this.isModified()) {
        this.lastUpdatedAt = new Date();
    }
    next();
});

// --- CHÚNG TA ĐÃ XÓA HOÀN TOÀN CÁC ĐOẠN .set('toJSON', ...) GÂY LỖI Ở ĐÂY ---

module.exports = mongoose.model('Story', storySchema);