/**
 * uploadImage.js - Utility for uploading images to backend
 * Thay thế cho hàm upload trước đây sử dụng Firebase Storage
 */

const API_URL = "http://localhost:5000"; // Thay đổi URL này theo cấu hình thực tế của bạn

/**
 * Upload ảnh lên backend Node.js
 * @param {File} file - File ảnh cần upload
 * @param {string} userId - ID của người dùng (tùy chọn)
 * @returns {Promise<string>} URL của ảnh sau khi upload
 */
const uploadImage = async (file, userId = null) => {
  if (!file) {
    throw new Error("Không có file để upload");
  }

  try {
    const formData = new FormData();
    formData.append("image", file);
    
    if (userId) {
      formData.append("userId", userId);
    }
    
    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lỗi khi upload ảnh");
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export default uploadImage;