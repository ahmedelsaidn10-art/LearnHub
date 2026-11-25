// Vite exposes only variables prefixed with VITE_ to browser code.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// These paths match the Flask API routes.
export const API_ROUTES = Object.freeze({
  auth: {
    register: '/api/auth/register',
    verifyEmail: '/api/auth/verify-email',
    resendVerification: '/api/auth/resend-verification',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    currentUser: '/api/auth/me',
  },
  courses: '/api/courses',
  myCourses: '/api/my-courses',
  favorites: '/api/favorites',
});

export function assetUrl(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
