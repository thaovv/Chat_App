const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { pool, checkConnection, initDatabase } = require('./db');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer cho việc upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn kích thước file 5MB
  },
  fileFilter: function (req, file, cb) {
    // Chỉ chấp nhận file ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên file ảnh!'), false);
    }
  }
});

// API endpoint để upload ảnh
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    const fileName = req.file.filename;
    const filePath = req.file.path;
    const userId = req.body.userId || null; // Lấy userId nếu được gửi lên
    
    // Lưu thông tin file vào database
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        'INSERT INTO images (filename, filepath, user_id) VALUES (?, ?, ?)',
        [fileName, filePath, userId]
      );
      
      // Trả về URL của ảnh đã tải lên
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
      
      return res.status(201).json({
        message: 'Tải lên file thành công',
        imageId: result.insertId,
        imageUrl
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Lỗi khi tải lên file:', error);
    return res.status(500).json({ message: 'Tải lên file thất bại', error: error.message });
  }
});

// API endpoint để xóa ảnh
app.delete('/api/upload/:id', async (req, res) => {
  try {
    const imageId = req.params.id;
    const connection = await pool.getConnection();
    
    try {
      // Lấy thông tin file trước khi xóa
      const [rows] = await connection.execute(
        'SELECT filepath FROM images WHERE id = ?',
        [imageId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy ảnh' });
      }
      
      const filePath = rows[0].filepath;
      
      // Xóa file từ hệ thống
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Xóa record từ database
      await connection.execute(
        'DELETE FROM images WHERE id = ?',
        [imageId]
      );
      
      return res.status(200).json({ message: 'Xóa ảnh thành công' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Lỗi khi xóa ảnh:', error);
    return res.status(500).json({ message: 'Xóa ảnh thất bại', error: error.message });
  }
});

// Khởi động server
const startServer = async () => {
  try {
    // Kiểm tra kết nối database
    const connected = await checkConnection();
    if (connected) {
      // Khởi tạo database nếu cần
      await initDatabase();
      
      // Bắt đầu lắng nghe kết nối
      app.listen(PORT, () => {
        console.log(`Server đang chạy tại port ${PORT}`);
      });
    } else {
      console.error('Không thể khởi động server do lỗi kết nối database');
    }
  } catch (error) {
    console.error('Lỗi khi khởi động server:', error);
  }
};

// Khởi động server
startServer();