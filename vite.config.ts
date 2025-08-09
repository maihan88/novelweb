import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite'; // <-- THÊM DÒNG NÀY

export default defineConfig(({ mode }) => {
    // Giữ nguyên logic load biến môi trường
    const env = loadEnv(mode, '.', '');
    
    return {
      // THÊM KHỐI plugins
      plugins: [
        tailwindcss(), 
      ],
      // Giữ nguyên cấu hình define để dùng biến môi trường trong code frontend
      define: {
        // Bạn có thể bỏ bớt một dòng nếu tên biến là duy nhất
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      // Giữ nguyên cấu hình alias để import file gọn hơn
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});