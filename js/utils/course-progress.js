import { getCompletedLessonIds, saveCompletedLessonIds, STORAGE_KEYS } from '../services/learning-service.js';

// Shared progress helpers keep lesson IDs and percentage calculations consistent across pages.
export const COURSE_PROGRESS_KEY = STORAGE_KEYS.courseProgress;

export function getCourseCurriculum(course) {
  return course.details?.curriculum ?? [
    { title: 'Getting started', lessons: ['Course overview', 'Tools and learning setup'] },
    { title: 'Core skills and guided practice', lessons: ['Key concepts', 'Step-by-step exercises'] },
    { title: 'Apply what you learned', lessons: ['Practical project', 'Next steps'] },
  ];
}

export function getCourseLessonIds(course) {
  return getCourseCurriculum(course).flatMap((section, sectionIndex) =>
    section.lessons.map((_, lessonIndex) => `section-${sectionIndex + 1}-lesson-${lessonIndex + 1}`));
}

export function readCompletedLessons(courseId) {
  return getCompletedLessonIds(courseId);
}

export function saveCompletedLessons(courseId, completedLessons) {
  return saveCompletedLessonIds(courseId, completedLessons);
}
