# Sukem Novel Backend

Backend API cho ứng dụng đọc truyện Sukem Novel, được xây dựng với Node.js, Express.js và MongoDB.

## 🚀 Cài đặt và Chạy

### Yêu cầu hệ thống
- Node.js (v14 trở lên)
- MongoDB (local hoặc cloud)
- npm hoặc yarn

### Cài đặt

1. **Clone repository và cài đặt dependencies:**
```bash
cd sukem-novel-backend
npm install
```

2. **Tạo file .env:**
```bash
cp env.example .env
```

3. **Cấu hình biến môi trường trong file .env:**
```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/sukem-novel

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
```

4. **Chạy MongoDB:**
   - Cài đặt MongoDB Community Server
   - Hoặc sử dụng MongoDB Atlas (cloud)

5. **Import dữ liệu mẫu:**
```bash
node seed.js
```

6. **Khởi động server:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📁 Cấu trúc thư mục

```
sukem-novel-backend/
├── config/           # Cấu hình database
├── controllers/      # Logic xử lý request
├── middleware/       # Authentication middleware
├── models/          # Mongoose schemas
├── routes/          # API routes
├── server.js        # Entry point
├── seed.js          # Script import dữ liệu
└── package.json
```

## 🔗 API Endpoints

### Stories
- `GET /api/stories` - Lấy tất cả truyện
- `GET /api/stories/:id` - Lấy truyện theo ID
- `POST /api/stories` - Tạo truyện mới (Admin)
- `PUT /api/stories/:id` - Cập nhật truyện (Admin)
- `DELETE /api/stories/:id` - Xóa truyện (Admin)
- `POST /api/stories/:id/view` - Tăng lượt xem
- `POST /api/stories/:id/rating` - Đánh giá truyện (Auth)

### Users
- `POST /api/users/register` - Đăng ký
- `POST /api/users/login` - Đăng nhập
- `GET /api/users/profile` - Lấy thông tin user (Auth)

## 🔐 Authentication

API sử dụng JWT (JSON Web Tokens) cho authentication:

1. **Đăng ký/Đăng nhập** để nhận token
2. **Gửi token** trong header: `Authorization: Bearer <token>`
3. **Admin routes** yêu cầu role admin

## 🛠️ Công nghệ sử dụng

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT
- **Password Hashing:** bcryptjs
- **CORS:** cors
- **Environment:** dotenv

## 📊 Database Schema

### User Schema
```javascript
{
  id: String,
  username: String,
  password: String (hashed),
  role: String (user/admin),
  createdAt: Date
}
```

### Story Schema
```javascript
{
  id: String,
  title: String,
  author: String,
  description: String,
  coverImage: String,
  tags: [String],
  status: String,
  volumes: [VolumeSchema],
  views: Number,
  rating: Number,
  ratingsCount: Number,
  isHot: Boolean,
  isInBanner: Boolean,
  createdAt: Date,
  lastUpdatedAt: Date
}
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key cho JWT
- `PORT`: Port server (default: 5000)
- `NODE_ENV`: Environment (development/production)

## 📝 Scripts

- `npm start`: Chạy server production
- `npm run dev`: Chạy server development với nodemon
- `node seed.js`: Import dữ liệu mẫu

## 🔧 Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB đã chạy chưa
- Kiểm tra MONGO_URI trong .env
- Kiểm tra network connectivity

### Lỗi JWT
- Kiểm tra JWT_SECRET trong .env
- Token có thể đã hết hạn (30 ngày)

### Lỗi CORS
- Backend đã cấu hình CORS cho frontend
- Kiểm tra frontend URL trong cấu hình

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:
1. Console logs
2. MongoDB connection
3. Environment variables
4. Network connectivity 