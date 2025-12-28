import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 關鍵設定：使用相對路徑 './' 而不是絕對路徑 '/'
  // 這樣無論您的 GitHub Repo 名稱是什麼，網頁都能正確載入資源
  base: './', 
});