const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    // Reference về Story (Dùng _id của MongoDB để tối ưu join)
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
    
    // Lưu ID của Volume mà chương này thuộc về (để map lại vào volume)
    volumeId: { type: String, required: true },
    
    // Các trường cũ của bạn
    id: { type: String, required: true, unique: true }, // ID dạng slug (ch-chapter-1...)
    title: { type: String, required: true },
    content: { type: String, required: true }, // NỘI DUNG NẰM Ở ĐÂY
    isRaw: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    
    chapterNumber: { type: Number, default: 0 } // Thêm field này để sort cho dễ
}, {
    timestamps: true
});

// Index để tìm chương theo truyện và volume cực nhanh
chapterSchema.index({ storyId: 1, volumeId: 1 });
chapterSchema.index({ id: 1 });

const Chapter = mongoose.model('Chapter', chapterSchema);
module.exports = Chapter;
