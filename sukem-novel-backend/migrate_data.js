require('dotenv').config();
const mongoose = require('mongoose');

// --- CẤU HÌNH ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sukem-novel"; // Đảm bảo URI đúng

// --- ĐỊNH NGHĨA SCHEMAS TẠM THỜI (Để đọc được dữ liệu cũ) ---

// 1. Schema Chapter Mới (Nơi dữ liệu sẽ chuyển đến)
const chapterSchema = new mongoose.Schema({
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: true },
    volumeId: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    isRaw: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    chapterNumber: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const NewChapter = mongoose.model('Chapter', chapterSchema);

// 2. Schema Story Cũ (Phải khai báo mảng chapters để Mongoose đọc được dữ liệu cũ)
const oldStorySchema = new mongoose.Schema({
    title: String,
    volumes: [{
        id: String,
        title: String,
        // QUAN TRỌNG: Phải khai báo chapters ở đây để hứng dữ liệu cũ
        chapters: [{
            id: String,
            title: String,
            content: String,
            views: Number,
            isRaw: Boolean,
            createdAt: Date
        }]
    }],
    totalViews: Number
}, { strict: false }); // strict: false để bỏ qua các trường khác không cần thiết

const OldStory = mongoose.model('Story', oldStorySchema);

// --- HÀM MIGRATION ---
const migrateData = async () => {
    try {
        console.log('🔌 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối thành công.');

        console.log('🔄 Bắt đầu quá trình migration...');
        
        // Dùng cursor để duyệt qua từng truyện, tránh load tất cả vào RAM gây crash
        const cursor = OldStory.find({}).cursor();

        let totalChaptersMoved = 0;
        let totalStoriesProcessed = 0;

        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            console.log(`Processing story: ${doc.title} (${doc._id})...`);
            
            let storyChaptersCount = 0;
            let totalStoryViews = 0;

            if (doc.volumes && doc.volumes.length > 0) {
                for (const volume of doc.volumes) {
                    if (volume.chapters && volume.chapters.length > 0) {
                        
                        const chaptersToInsert = [];

                        // Duyệt qua từng chapter cũ trong volume
                        volume.chapters.forEach((oldChap, index) => {
                            chaptersToInsert.push({
                                storyId: doc._id,
                                volumeId: volume.id,
                                id: oldChap.id,
                                title: oldChap.title,
                                content: oldChap.content || "Nội dung trống",
                                isRaw: oldChap.isRaw || false,
                                views: oldChap.views || 0,
                                chapterNumber: index + 1, // Đánh số chương theo thứ tự
                                createdAt: oldChap.createdAt || new Date()
                            });
                            
                            totalStoryViews += (oldChap.views || 0);
                        });

                        // Insert vào bảng Chapter mới
                        if (chaptersToInsert.length > 0) {
                            // Dùng insertMany để insert nhanh hơn
                            // ordered: false để nếu 1 chapter lỗi thì các chapter khác vẫn chạy
                            try {
                                await NewChapter.insertMany(chaptersToInsert, { ordered: false });
                                storyChaptersCount += chaptersToInsert.length;
                            } catch (err) {
                                // Bỏ qua lỗi duplicate key (nếu chạy lại script nhiều lần)
                                if (err.code === 11000) {
                                    console.log(`⚠️  Phát hiện chapter trùng lặp, bỏ qua.`);
                                } else {
                                    console.error(`❌ Lỗi insert chapter:`, err);
                                }
                            }
                        }

                        // QUAN TRỌNG: Xóa chapters khỏi volume trong object hiện tại
                        volume.chapters = []; 
                    }
                }
            }

            // Cập nhật lại Story: Xóa mảng chapters và cập nhật totalViews
            await OldStory.updateOne(
                { _id: doc._id },
                { 
                    $set: { 
                        volumes: doc.volumes, // Lưu lại volumes đã bị rỗng chapters
                        totalViews: totalStoryViews 
                    } 
                }
            );

            totalChaptersMoved += storyChaptersCount;
            totalStoriesProcessed++;
            console.log(`   -> Đã chuyển ${storyChaptersCount} chương. Đã update Story.`);
        }

        console.log('=============================================');
        console.log('🎉 MIGRATION HOÀN TẤT!');
        console.log(`📊 Tổng số truyện đã xử lý: ${totalStoriesProcessed}`);
        console.log(`📦 Tổng số chương đã tách bảng: ${totalChaptersMoved}`);
        console.log('=============================================');

        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi Fatal:', error);
        process.exit(1);
    }
};

migrateData();