import { courses } from '../data/course-catalog.js';
import { API_ROUTES } from './app-config.js';
import { apiRequest } from './api-client.js';

// Local catalog is the active data source until the backend API is connected.
export function getCourses() {
  return courses;
}

export function getCourseById(courseId) {
  return courses.find((course) => course.id === courseId) ?? null;
}

// Prepared backend equivalents. Keep these dormant until the backend contract is confirmed.
export async function getCoursesFromApi() {
  const payload = await apiRequest(API_ROUTES.courses, { method: 'GET' });
  return Array.isArray(payload) ? payload : payload?.courses ?? [];
}

export async function getCourseByIdFromApi(courseId) {
  return apiRequest(`${API_ROUTES.courses}/${encodeURIComponent(courseId)}`, { method: 'GET' });
}
