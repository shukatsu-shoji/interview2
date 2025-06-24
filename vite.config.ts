import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // 本番ビルド最適化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 本番環境ではconsole.logを削除
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
        },
      },
    },
    // チャンクサイズ警告の閾値を調整
    chunkSizeWarningLimit: 1000,
  },
  // 本番環境でのソースマップ生成（デバッグ用）
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});