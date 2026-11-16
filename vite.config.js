import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  appType: 'mpa',
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      // Build both app pages so the course catalog ships with the production site.
      input: {
        index: resolve(process.cwd(), 'index.html'),
        courses: resolve(process.cwd(), 'courses.html'),
        courseDetails: resolve(process.cwd(), 'course-details.html'),
        myCourses: resolve(process.cwd(), 'my-courses.html'),
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
