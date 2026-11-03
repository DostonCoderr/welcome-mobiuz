import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5172,
    strictPort: true,
    allowedHosts: ['.ngrok-free.app', 'localhost', '127.0.0.1'],
    // ⚡ Proxy butunlay o'chirildi
  },
  preview: {
    host: '0.0.0.0',
    port: 5172,
    allowedHosts: ['.ngrok-free.app', 'localhost', '127.0.0.1'],
    // ⚡ Proxy butunlay o'chirildi
  },
});