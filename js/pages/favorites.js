import { courseCardMarkup, escapeHtml } from '../components/course-card/course-card.js';
import { createPagination, getPageRange } from '../components/pagination/pagination.js';
import { getCurrentAccount } from '../services/auth-service.js';
import { getFavorites, removeCourseFromFavorites } from '../services/learning-service.js';
import { redirectToLogin } from '../utils/auth-navigation.js';

const PAGE_SIZE = 6;

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

export async function init() {
  const grid = document.querySelector('#favorites-grid');
  const emptyState = document.querySelector('#favorites-empty');
  const count = document.querySelector('#favorites-total');
  const resultCount = document.querySelector('#favorites-results-count');
  const search = document.querySelector('#favorites-search');
  const clearSearch = document.querySelector('#clear-favorites-search');
  const filters = document.querySelector('#favorites-category-filters');
  const pagination = document.querySelector('#favorites-pagination');
  const dialog = document.querySelector('#remove-favorite-dialog');
  const removeMessage = document.querySelector('#remove-favorite-message');
  if (!grid || !emptyState || !count || !resultCount || !search || !filters || !pagination || !dialog) return;

  grid.setAttribute('aria-busy', 'true');
  try {
    const account = await getCurrentAccount();
    if (!account) return redirectToLogin();
  } catch (error) {
    if (error.status === 401) return redirectToLogin();
    grid.setAttribute('aria-busy', 'false');
    showToast(error.message || 'Could not check your account.');
    return;
  }

  let favoriteCourses;
  try {
    favoriteCourses = await getFavorites();
  } catch (error) {
    if (error.status === 401) return redirectToLogin();
    grid.setAttribute('aria-busy', 'false');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('h2').textContent = 'Could not load favorites';
    emptyState.querySelector('p').textContent = error.message || 'Please try again later.';
    return;
  }

  let activeCategory = 'all';
  let currentPage = 1;
  let pendingRemovalId = null;
  const renderPagination = createPagination(pagination, (page) => {
    currentPage = page;
    render();
    document.querySelector('#favorites-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 'Favorites pages');

  function renderFilters() {
    const categories = [...new Set(favoriteCourses.map((course) => course.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const options = [
      { value: 'all', label: `All categories (${favoriteCourses.length})` },
      ...categories.map((category) => ({ value: category, label: `${category} (${favoriteCourses.filter((course) => course.category === category).length})` })),
    ];
    if (activeCategory !== 'all' && !categories.includes(activeCategory)) activeCategory = 'all';
    filters.innerHTML = options.map(({ value, label }) => {
      const active = activeCategory === value;
      return `<button class="category-filter shrink-0 rounded-full px-4 py-2.5 text-label-lg transition ${active ? 'bg-primary-container font-semibold text-white shadow-sm' : 'bg-surface-container-lowest text-on-surface-variant shadow-sm hover:bg-surface-container dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}" type="button" data-category="${escapeHtml(value)}" aria-pressed="${active}">${escapeHtml(label)}</button>`;
    }).join('');
  }

  function render() {
    renderFilters();
    const query = search.value.trim().toLocaleLowerCase();
    const visibleCourses = favoriteCourses.filter((course) =>
      (activeCategory === 'all' || course.category === activeCategory)
      && (!query || course.title.toLocaleLowerCase().includes(query)));
    const pageCount = Math.ceil(visibleCourses.length / PAGE_SIZE);
    currentPage = Math.min(currentPage, Math.max(pageCount, 1));
    const range = getPageRange(currentPage, PAGE_SIZE, visibleCourses.length);
    const pageCourses = visibleCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const favoriteIds = new Set(favoriteCourses.map((course) => String(course.id)));

    count.textContent = String(favoriteCourses.length);
    resultCount.textContent = visibleCourses.length
      ? `Showing ${range.start}-${range.end} of ${visibleCourses.length} courses`
      : 'Showing 0 courses';
    grid.innerHTML = pageCourses.map((course) => courseCardMarkup(course, favoriteIds)).join('');
    grid.setAttribute('aria-busy', 'false');
    emptyState.classList.toggle('hidden', visibleCourses.length > 0);
    grid.classList.toggle('hidden', visibleCourses.length === 0);
    if (!visibleCourses.length) {
      const noFavorites = favoriteCourses.length === 0;
      emptyState.querySelector('h2').textContent = noFavorites ? 'No favorites yet' : 'No matching courses';
      emptyState.querySelector('p').textContent = noFavorites
        ? 'Save a course with the heart button and it will appear here.'
        : 'Try another search or choose a different category.';
      emptyState.querySelector('a').textContent = 'Explore courses';
    }
    renderPagination({ page: currentPage, totalPages: pageCount });
    clearSearch.classList.toggle('hidden', !search.value);
  }

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    currentPage = 1;
    render();
  });
  search.addEventListener('input', () => { currentPage = 1; render(); });
  clearSearch.addEventListener('click', () => { search.value = ''; currentPage = 1; render(); search.focus(); });

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.favorite-course');
    if (!button) return;
    pendingRemovalId = Number(button.dataset.courseId);
    const course = favoriteCourses.find((item) => item.id === pendingRemovalId);
    removeMessage.textContent = `"${course?.title || 'This course'}" will be removed from your favorites.`;
    dialog.showModal();
  });
  document.querySelector('#cancel-remove-favorite').addEventListener('click', () => {
    pendingRemovalId = null;
    dialog.close();
  });
  document.querySelector('#confirm-remove-favorite').addEventListener('click', async (event) => {
    if (!pendingRemovalId) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await removeCourseFromFavorites(pendingRemovalId);
      favoriteCourses = favoriteCourses.filter((course) => course.id !== pendingRemovalId);
      pendingRemovalId = null;
      dialog.close();
      currentPage = Math.min(currentPage, Math.max(1, Math.ceil(favoriteCourses.length / PAGE_SIZE)));
      render();
      showToast('Course removed from favorites.');
    } catch (error) {
      if (error.status === 401) redirectToLogin();
      else showToast(error.message || 'Could not remove this course.');
    } finally {
      button.disabled = false;
    }
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  render();
}
