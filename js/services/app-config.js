// Vite exposes only variables prefixed with VITE_ to browser code.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const isApiConfigured = Boolean(API_BASE_URL);

// These routes are the proposed contract for the future backend. Adjust them to match its routes.
export const API_ROUTES = Object.freeze({
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    currentUser: '/api/auth/me',
  },
  courses: '/api/courses',
  myCourses: '/api/me/courses',
  savedCourses: '/api/me/saved-courses',
  progress: '/api/me/course-progress',
});
