import { readStoredValue, writeStoredValue } from './local-storage.js';
import { API_ROUTES } from './app-config.js';
import { apiRequest } from './api-client.js';

// Keep the existing keys so current learners' saved browser data remains available.
export const STORAGE_KEYS = Object.freeze({
  savedCourses: 'learnhub:saved-courses',
  enrolledCourses: 'learnhub:enrolled-courses',
  courseProgress: 'learnhub:course-progress',
});

function readIdList(key) {
  const value = readStoredValue(key, []);
  return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string'))] : [];
}

export function getSavedCourseIds() { return readIdList(STORAGE_KEYS.savedCourses); }
export function saveCourseIds(ids) { return writeStoredValue(STORAGE_KEYS.savedCourses, [...new Set(ids)]); }
export function getEnrolledCourseIds() { return readIdList(STORAGE_KEYS.enrolledCourses); }
export function saveEnrolledCourseIds(ids) { return writeStoredValue(STORAGE_KEYS.enrolledCourses, [...new Set(ids)]); }

export function getCompletedLessonIds(courseId) {
  const allProgress = readStoredValue(STORAGE_KEYS.courseProgress, {});
  const completed = allProgress && !Array.isArray(allProgress) ? allProgress[courseId] : [];
  return new Set(Array.isArray(completed) ? completed : []);
}

export function saveCompletedLessonIds(courseId, completedLessonIds) {
  const current = readStoredValue(STORAGE_KEYS.courseProgress, {});
  const safeProgress = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  safeProgress[courseId] = [...completedLessonIds];
  return writeStoredValue(STORAGE_KEYS.courseProgress, safeProgress);
}

// These API methods are the replacement points for the local functions above.
// Their expected payloads are documented in BACKEND_INTEGRATION.md.
export async function getSavedCourseIdsFromApi() {
  const payload = await apiRequest(API_ROUTES.savedCourses, { method: 'GET' });
  return payload?.courseIds ?? [];
}

export function saveCourseIdToApi(courseId) {
  return apiRequest(`${API_ROUTES.savedCourses}/${encodeURIComponent(courseId)}`, { method: 'PUT' });
}

export function removeSavedCourseIdFromApi(courseId) {
  return apiRequest(`${API_ROUTES.savedCourses}/${encodeURIComponent(courseId)}`, { method: 'DELETE' });
}

export async function getEnrolledCourseIdsFromApi() {
  const payload = await apiRequest(API_ROUTES.myCourses, { method: 'GET' });
  return payload?.courseIds ?? [];
}

export function enrollInCourseWithApi(courseId) {
  return apiRequest(API_ROUTES.myCourses, { method: 'POST', body: { courseId } });
}

export function removeEnrolledCourseWithApi(courseId) {
  return apiRequest(`${API_ROUTES.myCourses}/${encodeURIComponent(courseId)}`, { method: 'DELETE' });
}

export async function getCompletedLessonIdsFromApi(courseId) {
  const payload = await apiRequest(`${API_ROUTES.progress}/${encodeURIComponent(courseId)}`, { method: 'GET' });
  return new Set(payload?.completedLessonIds ?? []);
}

export function saveCompletedLessonIdsToApi(courseId, completedLessonIds) {
  return apiRequest(`${API_ROUTES.progress}/${encodeURIComponent(courseId)}`, {
    method: 'PUT',
    body: { completedLessonIds: [...completedLessonIds] },
  });
}
