import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  appType: 'mpa',
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000' },
      '/uploads': { target: 'http://127.0.0.1:5000' },
    },
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      // List every HTML entry so Vite includes all multipage routes in production.
      input: {
        index: resolve(process.cwd(), 'index.html'),
        courses: resolve(process.cwd(), 'courses.html'),
        courseDetails: resolve(process.cwd(), 'course-details.html'),
        myCourses: resolve(process.cwd(), 'my-courses.html'),
        favorites: resolve(process.cwd(), 'favorites.html'),
        register: resolve(process.cwd(), 'register.html'),
        login: resolve(process.cwd(), 'login.html'),
      },
      output: {
        assetFileNames: (asset) => asset.name?.endsWith('.css')
          ? 'css/output.css'
          : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
