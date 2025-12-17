const mongoose = require('mongoose');

// --- HÀM TẠO SLUG ---
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// Schema cho Chapter (Không dùng unique ở id)
const chapterSchema = new mongoose.Schema({
    id: { type: String, required: true }, 
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    isRaw: { type: Boolean, default: false },
}, { _id: false });

// Schema cho Volume (Không dùng unique ở id)
const volumeSchema = new mongoose.Schema({
    id: { type: String, required: true }, 
    title: { type: String, required: true },
    chapters: [chapterSchema],
}, { _id: false });

// Schema cho Story
const storySchema = new mongoose.Schema({
    // ID của truyện (unique: true là đúng cho truyện chính)
    id: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    alias: { type: [String], default: [] },
    author: { type: String, required: true },
    description: String,
    coverImage: { type: String, required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['Đang dịch', 'Hoàn thành'], default: 'Đang dịch' },
    volumes: [volumeSchema],
    rating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    isHot: { type: Boolean, default: false },
    isInBanner: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastUpdatedAt: { type: Date, default: Date.now },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false // Tắt virtual id mặc định
});

storySchema.virtual('views').get(function() {
  if (!this.volumes || this.volumes.length === 0) {
    return 0;
  }
  return this.volumes.reduce((totalViews, volume) => {
    const volumeViews = volume.chapters.reduce((volTotal, chapter) => volTotal + chapter.views, 0);
    return totalViews + volumeViews;
  }, 0);
});

// Middleware tự động tạo slug
storySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('title')) {
    let baseId = slugify(this.title);

    if (!baseId || baseId.length === 0) {
      baseId = `story-${Date.now()}`;
    }

    let storyId = baseId;
    let counter = 1;
    const StoryModel = this.constructor;

    while (await StoryModel.countDocuments({ id: storyId }) > 0) {
      storyId = `${baseId}-${counter}`;
      counter++;
    }
    this.id = storyId;
  }
  next();
});

const Story = mongoose.model('Story', storySchema);

// --- FIX LỖI QUAN TRỌNG: XÓA INDEX CŨ ---
// Đoạn code này sẽ chạy một lần để xóa index 'volumes.id_1' gây lỗi duplicate key
Story.collection.dropIndex('volumes.id_1')
    .then(() => {
        console.log('>>> SYSTEM: Đã xóa index cũ gây lỗi (volumes.id_1) thành công.');
    })
    .catch((err) => {
        // Mã lỗi 27 là IndexNotFound (không tìm thấy index), nghĩa là đã sạch sẽ, không cần lo
        if (err.code !== 27) {
            // Chỉ log nếu là lỗi khác, để tránh spam console
            // console.log('Info: Không tìm thấy index volumes.id_1 hoặc đã bị xóa.');
        }
    });

// Tương tự, xóa index chapters.id_1 nếu tồn tại (đề phòng)
Story.collection.dropIndex('volumes.chapters.id_1')
    .catch(() => {}); 

module.exports = Story;
