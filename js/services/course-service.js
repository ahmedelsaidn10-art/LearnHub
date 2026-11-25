import { API_ROUTES, assetUrl } from './app-config.js';
import { apiRequest, getAllPaginatedItems } from './api-client.js';

export function normalizeCourse(course) {
  if (!course || typeof course !== 'object') return course;
  return {
    ...course,
    id: Number(course.id),
    price: Number(course.price) || 0,
    rating: Number(course.rating) || 0,
    reviewCount: Number(course.reviewCount) || 0,
    students: Number(course.students) || 0,
    lessons: Number(course.lessons) || 0,
    published: Number(course.published) || 0,
    image: assetUrl(course.image),
    instructorImage: assetUrl(course.instructorImage),
    details: {
      ...(course.details || {}),
      outcomes: Array.isArray(course.details?.outcomes) ? course.details.outcomes : [],
      requirements: Array.isArray(course.details?.requirements) ? course.details.requirements : [],
      subtitles: Array.isArray(course.details?.subtitles)
        ? course.details.subtitles
        : course.details?.subtitles ? [course.details.subtitles] : [],
      curriculum: Array.isArray(course.details?.curriculum) ? course.details.curriculum : [],
    },
  };
}

export async function getCourses() {
  const courses = await getAllPaginatedItems(API_ROUTES.courses);
  return courses.map(normalizeCourse);
}

export async function getCourseById(courseId) {
  if (!courseId || !/^\d+$/.test(String(courseId))) return null;
  const response = await apiRequest(`${API_ROUTES.courses}/${encodeURIComponent(courseId)}`, { method: 'GET' });
  return response?.data ? normalizeCourse(response.data) : null;
}
