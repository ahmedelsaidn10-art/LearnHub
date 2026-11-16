import { getCourses } from '../services/course-service.js';
import { getEnrolledCourseIds, saveEnrolledCourseIds } from '../services/learning-service.js';
import { getCourseLessonIds, readCompletedLessons } from '../utils/course-progress.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function getCourseProgress(course) {
  const lessonIds = getCourseLessonIds(course);
  const completed = readCompletedLessons(course.id);
  const validCompletedCount = lessonIds.filter((lessonId) => completed.has(lessonId)).length;
  const percent = lessonIds.length ? Math.round((validCompletedCount / lessonIds.length) * 100) : 0;

  return {
    completed: validCompletedCount,
    total: lessonIds.length,
    percent,
    status: percent === 100 && lessonIds.length ? 'completed' : 'in-progress',
  };
}

function courseCardMarkup(course, progress) {
  const completed = progress.status === 'completed';
  const price = course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`;

  return `
    <article class="group flex h-full flex-col overflow-hidden rounded-3xl border border-outline-variant/50 bg-surface-container-lowest shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div class="relative aspect-video overflow-hidden bg-surface-container dark:bg-slate-800">
        <img class="h-full w-full object-cover transition duration-500 group-hover:scale-105" src="${escapeHtml(course.image)}" alt="${escapeHtml(course.category)} course preview" loading="lazy" />
        <span class="absolute left-3 top-3 rounded-full bg-surface-container-lowest/95 px-3 py-1 text-label-sm font-semibold text-primary shadow-sm dark:bg-slate-950/90 dark:text-blue-300">${escapeHtml(course.category)}</span>
        <button class="remove-course-button absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest/95 text-on-surface-variant shadow-sm transition hover:text-error dark:bg-slate-950/90 dark:text-slate-300 dark:hover:text-red-400" type="button" data-remove-course="${escapeHtml(course.id)}" aria-label="Remove ${escapeHtml(course.title)} from My Courses">
          <span class="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
        </button>
      </div>

      <div class="flex flex-1 flex-col p-5">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span class="text-label-sm text-on-surface-variant dark:text-slate-400">${escapeHtml(course.level)} · ${escapeHtml(course.duration)}</span>
          <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-semibold ${completed ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300'}">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">${completed ? 'task_alt' : 'pending'}</span>${completed ? 'Completed' : progress.percent ? 'In progress' : 'Not started'}
          </span>
        </div>

        <h3 class="mb-1 line-clamp-2 min-h-12 text-headline-sm font-bold leading-snug text-on-surface group-hover:text-primary-container dark:text-white">${escapeHtml(course.title)}</h3>
        <p class="mb-5 text-body-md text-on-surface-variant dark:text-slate-400">${escapeHtml(course.instructor)}</p>

        <div class="mt-auto rounded-2xl bg-surface-container-low p-4 dark:bg-slate-800/70">
          <div class="mb-2 flex items-center justify-between gap-2 text-label-sm">
            <span class="font-semibold text-on-surface dark:text-slate-200">Your progress</span>
            <span class="font-bold ${completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary dark:text-blue-300'}">${progress.percent}%</span>
          </div>
          <div class="mb-2 h-2 overflow-hidden rounded-full bg-surface-container-high dark:bg-slate-700" role="progressbar" aria-label="Progress in ${escapeHtml(course.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
            <div class="h-full rounded-full ${completed ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-primary dark:bg-blue-400'}" style="width: ${progress.percent}%"></div>
          </div>
          <p class="text-label-sm text-on-surface-variant dark:text-slate-400">${progress.completed} of ${progress.total} lessons completed</p>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3">
          <span class="text-label-sm text-on-surface-variant dark:text-slate-400">${course.lessons} lessons · ${price}</span>
          <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-label-lg font-semibold text-white shadow-sm transition ${completed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary-container hover:bg-primary'}" href="/course-details.html?course=${encodeURIComponent(course.id)}">
            <span>${completed ? 'Review course' : 'Continue learning'}</span><span class="material-symbols-outlined text-lg" aria-hidden="true">${completed ? 'replay' : 'arrow_forward'}</span>
          </a>
        </div>
      </div>
    </article>`;
}

function showToast(message) {
  let region = document.querySelector('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }

  const toast = document.createElement('p');
  toast.className = 'toast';
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

// Page setup: read enrollments and progress, then wire up search, filters, sorting, and removal.
export function init() {
  const courses = getCourses();
  const grid = document.querySelector('#my-course-grid');
  const emptyState = document.querySelector('#my-courses-empty');
  const search = document.querySelector('#my-courses-search');
  const clearSearch = document.querySelector('#clear-course-search');
  const sort = document.querySelector('#my-courses-sort');
  const filters = [...document.querySelectorAll('.my-course-filter')];
  const dialog = document.querySelector('#remove-course-dialog');
  const removeMessage = document.querySelector('#remove-course-message');

  if (!grid || !emptyState || !search || !sort || !dialog) return;

  let enrolledIds = getEnrolledCourseIds();
  let activeFilter = 'all';
  let pendingRemovalId = null;
  const courseById = new Map(courses.map((course) => [course.id, course]));

  function getEnrolledCourses() {
    return enrolledIds
      .map((id, index) => ({ course: courseById.get(id), index }))
      .filter((entry) => entry.course)
      .map(({ course, index }) => ({ course, index, progress: getCourseProgress(course) }));
  }

  function updateStats(enrolledCourses) {
    const inProgress = enrolledCourses.filter(({ progress }) => progress.status === 'in-progress').length;
    const completed = enrolledCourses.length - inProgress;
    document.querySelector('#stat-total').textContent = String(enrolledCourses.length);
    document.querySelector('#stat-in-progress').textContent = String(inProgress);
    document.querySelector('#stat-completed').textContent = String(completed);
    document.querySelector('#filter-count-all').textContent = String(enrolledCourses.length);
    document.querySelector('#filter-count-progress').textContent = String(inProgress);
    document.querySelector('#filter-count-completed').textContent = String(completed);
  }

  function updateEmptyState(isNoEnrollments) {
    document.querySelector('#empty-state-icon').textContent = isNoEnrollments ? 'school' : 'search_off';
    document.querySelector('#empty-state-title').textContent = isNoEnrollments ? 'No courses yet' : 'No matching courses';
    document.querySelector('#empty-state-description').textContent = isNoEnrollments
      ? 'Add a course to your learning list to see your progress here.'
      : 'Try another search or switch to a different course filter.';
  }

  function render() {
    const enrolledCourses = getEnrolledCourses();
    updateStats(enrolledCourses);
    clearSearch?.classList.toggle('hidden', !search.value);

    const query = search.value.trim().toLocaleLowerCase();
    const visibleCourses = enrolledCourses.filter(({ course, progress }) => {
      const matchesFilter = activeFilter === 'all' || progress.status === activeFilter;
      const searchable = `${course.title} ${course.instructor} ${course.category} ${course.level}`.toLocaleLowerCase();
      return matchesFilter && (!query || searchable.includes(query));
    });

    switch (sort.value) {
      case 'progress-desc': visibleCourses.sort((a, b) => b.progress.percent - a.progress.percent); break;
      case 'progress-asc': visibleCourses.sort((a, b) => a.progress.percent - b.progress.percent); break;
      case 'title': visibleCourses.sort((a, b) => a.course.title.localeCompare(b.course.title)); break;
      default: visibleCourses.sort((a, b) => a.index - b.index);
    }

    grid.innerHTML = visibleCourses.map(({ course, progress }) => courseCardMarkup(course, progress)).join('');
    grid.setAttribute('aria-busy', 'false');
    emptyState.classList.toggle('hidden', visibleCourses.length > 0);
    if (!visibleCourses.length) updateEmptyState(enrolledCourses.length === 0);
    document.querySelector('#results-count').textContent = `${visibleCourses.length} ${visibleCourses.length === 1 ? 'course' : 'courses'}`;
    document.querySelector('#my-courses-heading').textContent = activeFilter === 'completed'
      ? 'Completed courses'
      : activeFilter === 'in-progress'
        ? 'Courses in progress'
        : 'Your learning';
  }

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter || 'all';
      filters.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.setAttribute('aria-pressed', String(isActive));
        filterButton.classList.toggle('bg-primary-container', isActive);
        filterButton.classList.toggle('text-white', isActive);
        filterButton.classList.toggle('font-semibold', isActive);
        filterButton.classList.toggle('shadow-sm', isActive);
        filterButton.classList.toggle('text-on-surface-variant', !isActive);
        filterButton.classList.toggle('font-medium', !isActive);
      });
      render();
    });
  });

  search.addEventListener('input', render);
  clearSearch?.addEventListener('click', () => {
    search.value = '';
    render();
    search.focus();
  });
  sort.addEventListener('change', render);

  // Ask for confirmation before removing an enrollment; lesson progress remains available if re-added.
  grid.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-course]');
    if (!removeButton) return;
    pendingRemovalId = removeButton.dataset.removeCourse;
    const course = courseById.get(pendingRemovalId);
    if (course) removeMessage.textContent = `${course.title} will be removed from My Courses. Your lesson progress will stay saved.`;
    dialog.showModal();
  });

  document.querySelector('#cancel-remove-course').addEventListener('click', () => dialog.close());
  document.querySelector('#confirm-remove-course').addEventListener('click', () => {
    if (!pendingRemovalId) return;
    const course = courseById.get(pendingRemovalId);
    const nextIds = enrolledIds.filter((id) => id !== pendingRemovalId);
    if (!saveEnrolledCourseIds(nextIds)) {
      showToast('Could not update My Courses in this browser.');
      return;
    }
    enrolledIds = nextIds;
    pendingRemovalId = null;
    dialog.close();
    render();
    showToast(`${course?.title || 'Course'} removed from My Courses.`);
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Refresh when enrollment or lesson progress changes in another open tab.
  window.addEventListener('storage', (event) => {
    if (['learnhub:enrolled-courses', 'learnhub:course-progress'].includes(event.key)) {
      enrolledIds = getEnrolledCourseIds();
      render();
    }
  });

  render();
}
