import { getCurrentAccount } from '../services/auth-service.js';
import {
  getMyCourses,
  addCourseToFavorites,
  removeCourseFromFavorites,
  removeCourseFromMyCourses,
} from '../services/learning-service.js';
import { createPagination, getPageRange } from '../components/pagination/pagination.js';
import { redirectToLogin } from '../utils/auth-navigation.js';
import { renderLoadingIndicator, setButtonLoading } from '../utils/loading-state.js';

const PAGE_SIZE = 6;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
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

function getCourseProgress(course) {
  const progress = course.progress || {};
  const total = Number(progress.totalLessons ?? course.lessons) || 0;
  const completed = Number(progress.completedLessons) || 0;
  const percent = Math.max(0, Math.min(100, Number(progress.percentage) || 0));
  return {
    completed,
    total,
    percent,
    status: total > 0 && percent === 100 ? 'completed' : 'in-progress',
  };
}

function courseCardMarkup(course) {
  const progress = getCourseProgress(course);
  const completed = progress.status === 'completed';
  const isFavorite = Boolean(course.is_favorite);
  const price = course.price === 0 ? 'Free' : `$${Number(course.price).toFixed(2)}`;
  return `
    <article class="course-card group flex h-full flex-col overflow-hidden rounded-3xl border border-outline-variant/50 bg-surface-container-lowest shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div class="relative aspect-video overflow-hidden bg-surface-container dark:bg-slate-800">
        <img class="h-full w-full object-cover transition duration-500 group-hover:scale-105" src="${escapeHtml(course.image)}" alt="${escapeHtml(course.category)} course preview" loading="lazy" />
        <span class="absolute left-3 top-3 rounded-full bg-surface-container-lowest/95 px-3 py-1 text-label-sm font-semibold text-primary shadow-sm dark:bg-slate-950/90 dark:text-blue-300">${escapeHtml(course.category)}</span>
        <div class="absolute right-3 top-3 flex gap-2">
          <button class="favorite-course-button flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest/95 text-error shadow-sm transition hover:scale-105 dark:bg-slate-950/90 dark:text-red-400" type="button" data-favorite-course="${course.id}" aria-label="${isFavorite ? 'Remove' : 'Add'} ${escapeHtml(course.title)} ${isFavorite ? 'from' : 'to'} favorites" aria-pressed="${isFavorite}">
            <span class="material-symbols-outlined text-lg" aria-hidden="true" style="font-variation-settings: 'FILL' ${isFavorite ? 1 : 0}">${isFavorite ? 'favorite' : 'favorite_border'}</span>
          </button>
          <button class="remove-course-button flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest/95 text-on-surface-variant shadow-sm transition hover:text-error dark:bg-slate-950/90 dark:text-slate-300 dark:hover:text-red-400" type="button" data-remove-course="${course.id}" aria-label="Remove ${escapeHtml(course.title)} from My Courses">
            <span class="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
          </button>
        </div>
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
          <div class="mb-2 flex items-center justify-between gap-2 text-label-sm"><span class="font-semibold text-on-surface dark:text-slate-200">Your progress</span><span class="font-bold ${completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary dark:text-blue-300'}">${progress.percent}%</span></div>
          <div class="mb-2 h-2 overflow-hidden rounded-full bg-surface-container-high dark:bg-slate-700" role="progressbar" aria-label="Progress in ${escapeHtml(course.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}"><div class="h-full rounded-full ${completed ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-primary dark:bg-blue-400'}" style="width: ${progress.percent}%"></div></div>
          <p class="text-label-sm text-on-surface-variant dark:text-slate-400">${progress.completed} of ${progress.total} lessons completed</p>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3">
          <span class="text-label-sm text-on-surface-variant dark:text-slate-400">${Number(course.lessons) || 0} lessons · ${price}</span>
          <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-label-lg font-semibold text-white shadow-sm transition ${completed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary-container hover:bg-primary'}" href="/course-details.html?course=${course.id}"><span>${completed ? 'Review course' : 'Continue learning'}</span><span class="material-symbols-outlined text-lg" aria-hidden="true">${completed ? 'replay' : 'arrow_forward'}</span></a>
        </div>
      </div>
    </article>`;
}

export async function init() {
  const grid = document.querySelector('#my-course-grid');
  const emptyState = document.querySelector('#my-courses-empty');
  const search = document.querySelector('#my-courses-search');
  const clearSearch = document.querySelector('#clear-course-search');
  const sort = document.querySelector('#my-courses-sort');
  const filters = [...document.querySelectorAll('.my-course-filter')];
  const dialog = document.querySelector('#remove-course-dialog');
  const removeMessage = document.querySelector('#remove-course-message');
  const pagination = document.querySelector('#my-course-pagination');
  if (!grid || !emptyState || !search || !sort || !dialog || !pagination) return;

  grid.setAttribute('aria-busy', 'true');
  renderLoadingIndicator(grid, 'Loading your courses...');
  let account;
  try {
    account = await getCurrentAccount();
  } catch (error) {
    if (error.status === 401) return redirectToLogin();
    grid.replaceChildren();
    grid.classList.add('hidden');
    grid.setAttribute('aria-busy', 'false');
    showToast(error.message || 'Could not check your account.');
    return;
  }
  if (!account) return redirectToLogin();

  let enrolledCourses;
  try {
    enrolledCourses = await getMyCourses();
  } catch (error) {
    if (error.status === 401) return redirectToLogin();
    grid.replaceChildren();
    grid.classList.add('hidden');
    grid.setAttribute('aria-busy', 'false');
    emptyState.classList.remove('hidden');
    document.querySelector('#empty-state-title').textContent = 'Could not load your courses';
    document.querySelector('#empty-state-description').textContent = error.message || 'Please try again later.';
    return;
  }

  let activeFilter = 'all';
  let currentPage = 1;
  let pendingRemovalId = null;
  const renderPagination = createPagination(pagination, (page) => {
    currentPage = page;
    render();
    document.querySelector('#my-courses-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 'My Courses pages');

  function updateStats() {
    const inProgress = enrolledCourses.filter((course) => getCourseProgress(course).status === 'in-progress').length;
    const completed = enrolledCourses.length - inProgress;
    document.querySelector('#stat-total').textContent = String(enrolledCourses.length);
    document.querySelector('#stat-in-progress').textContent = String(inProgress);
    document.querySelector('#stat-completed').textContent = String(completed);
    document.querySelector('#filter-count-all').textContent = String(enrolledCourses.length);
    document.querySelector('#filter-count-progress').textContent = String(inProgress);
    document.querySelector('#filter-count-completed').textContent = String(completed);
  }

  function render() {
    updateStats();
    clearSearch?.classList.toggle('hidden', !search.value);
    const query = search.value.trim().toLocaleLowerCase();
    const visibleCourses = enrolledCourses.filter((course) => {
      const progress = getCourseProgress(course);
      const matchesFilter = activeFilter === 'all' || progress.status === activeFilter;
      const searchable = `${course.title} ${course.instructor} ${course.category} ${course.level}`.toLocaleLowerCase();
      return matchesFilter && (!query || searchable.includes(query));
    });

    switch (sort.value) {
      case 'progress-desc': visibleCourses.sort((a, b) => getCourseProgress(b).percent - getCourseProgress(a).percent); break;
      case 'progress-asc': visibleCourses.sort((a, b) => getCourseProgress(a).percent - getCourseProgress(b).percent); break;
      case 'title': visibleCourses.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: visibleCourses.sort((a, b) => new Date(b.enrolledAt || 0) - new Date(a.enrolledAt || 0));
    }

    const pageCount = Math.ceil(visibleCourses.length / PAGE_SIZE);
    currentPage = Math.min(currentPage, Math.max(pageCount, 1));
    const range = getPageRange(currentPage, PAGE_SIZE, visibleCourses.length);
    const pageCourses = visibleCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    grid.innerHTML = pageCourses.map(courseCardMarkup).join('');
    grid.setAttribute('aria-busy', 'false');
    emptyState.classList.toggle('hidden', visibleCourses.length > 0);
    if (!visibleCourses.length) {
      const noEnrollments = enrolledCourses.length === 0;
      document.querySelector('#empty-state-icon').textContent = noEnrollments ? 'school' : 'search_off';
      document.querySelector('#empty-state-title').textContent = noEnrollments ? 'No courses yet' : 'No matching courses';
      document.querySelector('#empty-state-description').textContent = noEnrollments
        ? 'Add a course to your learning list to see your progress here.'
        : 'Try another search or switch to a different course filter.';
      const emptyLink = emptyState.querySelector('a');
      if (emptyLink) emptyLink.textContent = 'Explore courses';
    }
    document.querySelector('#results-count').textContent = visibleCourses.length
      ? `Showing ${range.start}-${range.end} of ${visibleCourses.length} courses`
      : 'Showing 0 courses';
    renderPagination({ page: currentPage, totalPages: pageCount });
    document.querySelector('#my-courses-heading').textContent = activeFilter === 'completed'
      ? 'Completed courses'
      : activeFilter === 'in-progress' ? 'Courses in progress' : 'Your learning';
  }

  filters.forEach((button) => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    currentPage = 1;
    filters.forEach((item) => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('bg-primary-container', active);
      item.classList.toggle('text-white', active);
      item.classList.toggle('font-semibold', active);
      item.classList.toggle('shadow-sm', active);
      item.classList.toggle('text-on-surface-variant', !active);
      item.classList.toggle('font-medium', !active);
    });
    render();
  }));
  search.addEventListener('input', () => { currentPage = 1; render(); });
  clearSearch?.addEventListener('click', () => { search.value = ''; currentPage = 1; render(); search.focus(); });
  sort.addEventListener('change', () => { currentPage = 1; render(); });

  grid.addEventListener('click', async (event) => {
    const favoriteButton = event.target.closest('[data-favorite-course]');
    if (favoriteButton) {
      const courseId = Number(favoriteButton.dataset.favoriteCourse);
      const course = enrolledCourses.find((item) => item.id === courseId);
      if (!course) return;
      setButtonLoading(favoriteButton, true, 'Saving...');
      try {
        if (course.is_favorite) await removeCourseFromFavorites(courseId);
        else await addCourseToFavorites(courseId);
        course.is_favorite = !course.is_favorite;
        render();
        showToast(course.is_favorite ? 'Course added to favorites.' : 'Course removed from favorites.');
      } catch (error) {
        if (error.status === 401) redirectToLogin();
        else showToast(error.message || 'Could not update favorites.');
      } finally {
        setButtonLoading(favoriteButton, false);
      }
      return;
    }

    const removeButton = event.target.closest('[data-remove-course]');
    if (!removeButton) return;
    pendingRemovalId = Number(removeButton.dataset.removeCourse);
    const course = enrolledCourses.find((item) => item.id === pendingRemovalId);
    if (course) removeMessage.textContent = `${course.title} and its saved lesson progress will be removed from My Courses. If you add it again, progress starts over.`;
    dialog.showModal();
  });

  document.querySelector('#cancel-remove-course').addEventListener('click', () => { pendingRemovalId = null; dialog.close(); });
  document.querySelector('#confirm-remove-course').addEventListener('click', async (event) => {
    if (!pendingRemovalId) return;
    const button = event.currentTarget;
    setButtonLoading(button, true, 'Removing...');
    const course = enrolledCourses.find((item) => item.id === pendingRemovalId);
    try {
      await removeCourseFromMyCourses(pendingRemovalId);
      enrolledCourses = enrolledCourses.filter((item) => item.id !== pendingRemovalId);
      pendingRemovalId = null;
      dialog.close();
      render();
      showToast(`${course?.title || 'Course'} and its progress were removed from My Courses.`);
    } catch (error) {
      if (error.status === 401) redirectToLogin();
      else showToast(error.message || 'Could not remove this course.');
    } finally {
      setButtonLoading(button, false);
    }
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

  render();
}
