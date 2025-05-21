const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo pool connection để sử dụng cho các truy vấn
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chat_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối
const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Khởi tạo database nếu chưa có
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Tạo bảng images nếu chưa tồn tại
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(255) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255) NULL
      )
    `);
    
    // Tạo index cho user_id
    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_id ON images(user_id)
    `);
    
    console.log('Database initialized successfully');
    connection.release();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

module.exports = {
  pool,
  checkConnection,
  initDatabase
};