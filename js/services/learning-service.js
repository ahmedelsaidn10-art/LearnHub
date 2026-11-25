import { API_ROUTES } from './app-config.js';
import { apiRequest, getAllPaginatedItems } from './api-client.js';
import { normalizeCourse } from './course-service.js';

function positiveId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new TypeError('A valid course or lesson ID is required.');
  return id;
}

export async function getMyCourses() {
  const courses = await getAllPaginatedItems(API_ROUTES.myCourses);
  return courses.map(normalizeCourse);
}

export async function addCourseToMyCourses(courseId) {
  const response = await apiRequest(API_ROUTES.myCourses, {
    method: 'POST',
    body: { course_id: positiveId(courseId) },
  });
  return response?.data ?? null;
}

export function removeCourseFromMyCourses(courseId) {
  return apiRequest(`${API_ROUTES.myCourses}/${positiveId(courseId)}`, { method: 'DELETE' });
}

export async function updateLessonProgress(courseId, lessonId, completed) {
  const response = await apiRequest(
    `${API_ROUTES.myCourses}/${positiveId(courseId)}/lessons/${positiveId(lessonId)}`,
    { method: 'PATCH', body: { completed: Boolean(completed) } },
  );
  return response?.data ?? null;
}

export async function getFavorites() {
  const courses = await getAllPaginatedItems(API_ROUTES.favorites);
  return courses.map(normalizeCourse);
}

export async function addCourseToFavorites(courseId) {
  const response = await apiRequest(API_ROUTES.favorites, {
    method: 'POST',
    body: { course_id: positiveId(courseId) },
  });
  return response?.data ? normalizeCourse(response.data) : null;
}

export function removeCourseFromFavorites(courseId) {
  return apiRequest(`${API_ROUTES.favorites}/${positiveId(courseId)}`, { method: 'DELETE' });
}
