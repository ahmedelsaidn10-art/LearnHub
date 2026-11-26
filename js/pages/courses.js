import { getCourses } from '../services/course-service.js';
import { getCurrentAccount } from '../services/auth-service.js';
import { addCourseToFavorites, getFavorites, removeCourseFromFavorites } from '../services/learning-service.js';
import { courseCardMarkup, escapeHtml } from '../components/course-card/course-card.js';
import { createPagination, getPageRange } from '../components/pagination/pagination.js';
import { redirectToLogin } from '../utils/auth-navigation.js';
import { renderLoadingIndicator, setButtonLoading } from '../utils/loading-state.js';

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
  const grid = document.querySelector('#course-grid');
  const count = document.querySelector('#course-count');
  const search = document.querySelector('#course-search');
  const sort = document.querySelector('#course-sort');
  const level = document.querySelector('#course-level');
  const price = document.querySelector('#course-price');
  const pagination = document.querySelector('#course-pagination');
  const emptyState = document.querySelector('#course-empty-state');
  const resetButton = document.querySelector('#reset-course-filters');
  const categoryContainer = document.querySelector('[aria-label="Filter by category"]');

  if (!grid || !count || !search || !sort || !level || !price || !pagination || !emptyState || !categoryContainer) return;

  grid.setAttribute('aria-busy', 'true');
  renderLoadingIndicator(grid, 'Loading courses...');
  let courses;
  let favorites = new Set();
  try {
    [courses] = await Promise.all([getCourses()]);
    try {
      const account = await getCurrentAccount();
      if (account) favorites = new Set((await getFavorites()).map((course) => String(course.id)));
    } catch (error) {
      if (error.status !== 401) showToast('Your saved favorites could not be loaded.');
    }
  } catch (error) {
    count.textContent = 'Courses could not be loaded.';
    grid.replaceChildren();
    grid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('h3').textContent = 'Could not load courses';
    emptyState.querySelector('p').textContent = error.message || 'Check that the API server is running and try again.';
    grid.setAttribute('aria-busy', 'false');
    return;
  }

  let activeCategory = 'all';
  let currentPage = 1;
  const categories = [...new Set(courses.map((course) => course.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  categoryContainer.innerHTML = [
    ['all', 'All courses'],
    ...categories.map((category) => [category, category]),
  ].map(([value, label], index) => `
    <button class="category-filter shrink-0 rounded-full ${index === 0 ? 'bg-primary-container px-5 font-semibold text-white' : 'bg-surface-container-lowest px-4 text-on-surface-variant dark:bg-slate-800 dark:text-slate-300'} py-2.5 text-label-lg shadow-sm transition hover:opacity-90" type="button" data-category="${escapeHtml(value)}" aria-pressed="${index === 0}">${escapeHtml(label)}</button>`).join('');

  const categoryButtons = [...categoryContainer.querySelectorAll('.category-filter')];
  const renderPagination = createPagination(pagination, (page) => {
    currentPage = page;
    render();
    document.querySelector('#results-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function getVisibleCourses() {
    const query = search.value.trim().toLocaleLowerCase();
    const selectedLevel = level.value;
    const selectedPrice = price.value;
    const result = courses.filter((course) => {
      const searchable = `${course.title} ${course.category} ${course.instructor} ${course.level}`.toLocaleLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesCategory = activeCategory === 'all' || course.category === activeCategory;
      const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
      const matchesPrice = selectedPrice === 'all'
        || (selectedPrice === 'free' && course.price === 0)
        || (selectedPrice === 'paid' && course.price > 0);
      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });

    switch (sort.value) {
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'newest': result.sort((a, b) => b.published - a.published); break;
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      default: result.sort((a, b) => b.students - a.students);
    }
    return result;
  }

  function render() {
    const visibleCourses = getVisibleCourses();
    const pageCount = Math.ceil(visibleCourses.length / PAGE_SIZE);
    currentPage = Math.min(currentPage, Math.max(pageCount, 1));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageCourses = visibleCourses.slice(start, start + PAGE_SIZE);
    const hasFilters = Boolean(search.value.trim()) || activeCategory !== 'all' || level.value !== 'all' || price.value !== 'all';
    const range = getPageRange(currentPage, PAGE_SIZE, visibleCourses.length);

    count.textContent = visibleCourses.length
      ? `Showing ${range.start}-${range.end} of ${visibleCourses.length} courses`
      : `Showing 0 of ${courses.length} courses`;
    grid.innerHTML = pageCourses.map((course) => courseCardMarkup(course, favorites)).join('');
    grid.setAttribute('aria-busy', 'false');
    emptyState.classList.toggle('hidden', visibleCourses.length !== 0);
    grid.classList.toggle('hidden', visibleCourses.length === 0);
    resetButton?.classList.toggle('hidden', !hasFilters);
    renderPagination({ page: currentPage, totalPages: pageCount });
  }

  function clearFilters() {
    search.value = '';
    sort.value = 'popular';
    level.value = 'all';
    price.value = 'all';
    activeCategory = 'all';
    currentPage = 1;
    categoryButtons.forEach((button, index) => {
      const active = index === 0;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('bg-primary-container', active);
      button.classList.toggle('text-white', active);
      button.classList.toggle('font-semibold', active);
      button.classList.toggle('bg-surface-container-lowest', !active);
      button.classList.toggle('text-on-surface-variant', !active);
    });
    render();
  }

  search.addEventListener('input', () => { currentPage = 1; render(); });
  [sort, level, price].forEach((control) => control.addEventListener('change', () => { currentPage = 1; render(); }));
  categoryContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    currentPage = 1;
    categoryButtons.forEach((item) => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('bg-primary-container', active);
      item.classList.toggle('text-white', active);
      item.classList.toggle('font-semibold', active);
      item.classList.toggle('bg-surface-container-lowest', !active);
      item.classList.toggle('text-on-surface-variant', !active);
    });
    render();
  });

  grid.addEventListener('click', async (event) => {
    const button = event.target.closest('.favorite-course');
    if (!button) return;
    const courseId = Number(button.dataset.courseId);
    const isFavorite = favorites.has(String(courseId));
    setButtonLoading(button, true, 'Saving...');
    try {
      if (isFavorite) await removeCourseFromFavorites(courseId);
      else await addCourseToFavorites(courseId);
      if (isFavorite) favorites.delete(String(courseId));
      else favorites.add(String(courseId));
      render();
      showToast(isFavorite ? 'Course removed from favorites.' : 'Course added to favorites.');
    } catch (error) {
      if (error.status === 401) redirectToLogin();
      else showToast(error.message || 'Could not update your favorites.');
    } finally {
      setButtonLoading(button, false);
    }
  });

  resetButton?.addEventListener('click', clearFilters);
  document.querySelector('[data-clear-filters]')?.addEventListener('click', clearFilters);
  render();
}
