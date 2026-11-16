import { getCourses } from '../services/course-service.js';
import { getSavedCourseIds, saveCourseIds } from '../services/learning-service.js';

const PAGE_SIZE = 6;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// Escape text before placing catalog values into the card template.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function cardMarkup(course, favorites) {
  const isFavorite = favorites.has(course.id);
  const badge = course.label
    ? `<span class="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-3 py-1 text-label-sm font-semibold text-on-surface shadow-sm dark:bg-slate-900/90 dark:text-white">${escapeHtml(course.label)}</span>`
    : '';

  return `
    <article class="group flex flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-[#111827]">
      <div class="relative aspect-16/10 overflow-hidden bg-surface-container dark:bg-slate-800">
        <img class="h-full w-full object-cover transition duration-500 group-hover:scale-105" src="${course.image}" alt="${escapeHtml(course.category)} course preview" loading="lazy" />
        ${badge}
        <button class="favorite-course absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-on-surface-variant shadow-sm backdrop-blur transition hover:text-error dark:bg-slate-900/90 dark:text-slate-300" type="button" data-course-id="${escapeHtml(course.id)}" aria-label="${isFavorite ? 'Remove from' : 'Add to'} favorites: ${escapeHtml(course.title)}" aria-pressed="${isFavorite}">
          <span class="material-symbols-outlined text-xl" aria-hidden="true">${isFavorite ? 'favorite' : 'favorite_border'}</span>
        </button>
      </div>

      <div class="flex flex-1 flex-col p-5">
        <div class="mb-3 flex items-center justify-between gap-2">
          <span class="rounded-full bg-primary/10 px-2.5 py-1 text-label-sm font-semibold text-primary dark:bg-primary/20 dark:text-blue-300">${escapeHtml(course.category)}</span>
          <span class="text-label-sm text-on-surface-variant dark:text-slate-400">${escapeHtml(course.level)}</span>
        </div>
        <h3 class="mb-3 line-clamp-2 min-h-12 text-headline-sm font-bold leading-snug text-on-surface transition group-hover:text-primary-container dark:text-white">${escapeHtml(course.title)}</h3>

        <div class="mb-4 flex items-center gap-1.5 text-label-sm text-on-surface-variant dark:text-slate-400">
          <span class="material-symbols-outlined text-base text-amber-500" aria-hidden="true" style="font-variation-settings: 'FILL' 1">star</span>
          <strong class="text-on-surface dark:text-slate-200">${course.rating.toFixed(1)}</strong>
          <span>(${course.students.toLocaleString()} learners)</span>
        </div>

        <div class="mb-5 flex items-center gap-2 border-b border-outline-variant/50 pb-4 dark:border-slate-700">
          <img class="h-9 w-9 rounded-full object-cover" src="${course.instructorImage}" alt="" loading="lazy" />
          <span class="text-label-lg text-on-surface-variant dark:text-slate-300">${escapeHtml(course.instructor)}</span>
        </div>

        <div class="mt-auto flex items-center justify-between gap-3">
          <div>
            <p class="text-label-sm text-on-surface-variant dark:text-slate-400">${course.lessons} lessons Â· ${escapeHtml(course.duration)}</p>
            <p class="mt-0.5 text-headline-sm font-bold text-on-surface dark:text-white">${course.price === 0 ? 'Free' : money.format(course.price)}</p>
          </div>
          <a class="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-container px-4 py-2 text-label-lg font-semibold text-white shadow-sm transition hover:bg-primary focus-visible:outline-primary" href="/course-details.html?course=${encodeURIComponent(course.id)}">View course</a>
        </div>
      </div>
    </article>`;
}

// Initialize the catalog controls after the shared page shell has loaded.
export function init() {
  const courses = getCourses();
  const grid = document.querySelector('#course-grid');
  const count = document.querySelector('#course-count');
  const search = document.querySelector('#course-search');
  const sort = document.querySelector('#course-sort');
  const level = document.querySelector('#course-level');
  const price = document.querySelector('#course-price');
  const pagination = document.querySelector('#course-pagination');
  const emptyState = document.querySelector('#course-empty-state');
  const resetButton = document.querySelector('#reset-course-filters');
  const categoryButtons = [...document.querySelectorAll('.category-filter')];

  if (!grid || !count || !search || !sort || !level || !price || !pagination || !emptyState) return;

  let activeCategory = 'all';
  let currentPage = 1;
  let favorites = new Set(getSavedCourseIds());

  function getVisibleCourses() {
    const query = search.value.trim().toLocaleLowerCase();
    const selectedLevel = level.value;
    const selectedPrice = price.value;

    const visibleCourses = courses.filter((course) => {
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
      case 'rating': visibleCourses.sort((a, b) => b.rating - a.rating); break;
      case 'newest': visibleCourses.sort((a, b) => b.published - a.published); break;
      case 'price-asc': visibleCourses.sort((a, b) => a.price - b.price); break;
      case 'price-desc': visibleCourses.sort((a, b) => b.price - a.price); break;
      default: visibleCourses.sort((a, b) => b.students - a.students);
    }

    return visibleCourses;
  }

  function render() {
    const visibleCourses = getVisibleCourses();
    const pageCount = Math.ceil(visibleCourses.length / PAGE_SIZE);
    currentPage = Math.min(currentPage, Math.max(pageCount, 1));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageCourses = visibleCourses.slice(start, start + PAGE_SIZE);
    const hasFilters = Boolean(search.value.trim()) || activeCategory !== 'all' || level.value !== 'all' || price.value !== 'all';

    count.textContent = `Showing ${visibleCourses.length} of ${courses.length} courses`;
    grid.innerHTML = pageCourses.map((course) => cardMarkup(course, favorites)).join('');
    grid.setAttribute('aria-busy', 'false');
    emptyState.classList.toggle('hidden', visibleCourses.length !== 0);
    pagination.classList.toggle('hidden', pageCount <= 1);
    resetButton?.classList.toggle('hidden', !hasFilters);

    // Build accessible page controls; only the active page is marked current.
    pagination.innerHTML = Array.from({ length: pageCount }, (_, index) => {
      const page = index + 1;
      const active = page === currentPage;
      return `<button type="button" data-page="${page}" aria-label="Page ${page}" ${active ? 'aria-current="page"' : ''} class="flex h-11 w-11 items-center justify-center rounded-xl text-label-lg font-semibold shadow-sm transition ${active ? 'bg-primary-container text-white' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}">${page}</button>`;
    }).join('');
  }

  function clearFilters() {
    search.value = '';
    sort.value = 'popular';
    level.value = 'all';
    price.value = 'all';
    activeCategory = 'all';
    currentPage = 1;
    categoryButtons.forEach((button) => {
      const active = button.dataset.category === 'all';
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

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category || 'all';
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
  });

  pagination.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button) return;
    currentPage = Number(button.dataset.page) || 1;
    render();
    document.querySelector('#results-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Event delegation keeps favorite controls working after cards are re-rendered.
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('.favorite-course');
    if (!button) return;
    const courseId = button.dataset.courseId;
    if (favorites.has(courseId)) favorites.delete(courseId);
    else favorites.add(courseId);
    if (!saveCourseIds([...favorites])) return;
    render();
  });

  resetButton?.addEventListener('click', clearFilters);
  document.querySelector('[data-clear-filters]')?.addEventListener('click', clearFilters);

  render();
}
