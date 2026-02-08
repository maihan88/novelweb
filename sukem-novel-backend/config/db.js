// maihan88/novelweb/novelweb-367f3a44cd5ec3aa64d1df30fd841fd8db53199c/sukem-novel-backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            console.error('LỖI: MONGO_URI không tồn tại trong file .env');
            process.exit(1);
        }

        const conn = await mongoose.connect(uri, {
            // Mongoose 6+ mặc định đã có các option này, nhưng giữ lại nếu dùng bản cũ
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Lỗi kết nối Database: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;