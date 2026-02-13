const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình lưu trữ trên Cloudinary (Đã tối ưu hóa độ nét)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sukem-novel', // Tên thư mục trên Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'], // Thêm 'webp' để tối ưu dung lượng
    transformation: [
      { 
        width: 1200, 
        crop: 'limit', 
        quality: 'auto' 
      }
    ]
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên file ảnh!'), false);
    }
  }
});

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    res.json({
      success: true,
      file: {
        url: req.file.path,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Lỗi khi tải ảnh lên:', error);
    res.status(500).json({ message: 'Tải ảnh lên thất bại' });
  }
};

// Xuất multer để sử dụng trong file routes
exports.upload = upload.single('image');