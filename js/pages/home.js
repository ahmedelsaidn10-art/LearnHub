import { getCourses } from '../services/course-service.js';

// Choose which catalog entries appear in the home page's featured section.
const featuredCourseIds = [
  'modern-web-development',
  'ui-ux-product-design',
  'python-programming',
];

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

// Render a featured card from shared course data instead of keeping card HTML in index.html.
function renderCourseCard(course) {
  return `
    <article class="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div class="relative h-48 w-full overflow-hidden bg-surface-container dark:bg-slate-800 sm:h-44">
        <img class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src="${course.image}" alt="${escapeHtml(course.category)} course preview" loading="lazy" />
        <span class="absolute left-3 top-3 rounded-full bg-surface-container-lowest/95 px-2.5 py-1 text-label-sm font-semibold text-primary shadow-xs dark:bg-slate-900/95 dark:text-blue-300">${escapeHtml(course.category)}</span>
      </div>

      <div class="flex flex-1 flex-col p-5">
        <div class="mb-3 flex items-center justify-between gap-2">
          <span class="rounded-full bg-surface-container px-2 py-0.5 text-label-sm font-medium text-on-surface-variant dark:bg-slate-800 dark:text-slate-300">${escapeHtml(course.level)}</span>
          <span class="flex items-center gap-1 text-label-sm text-on-surface-variant dark:text-slate-400">
            <span class="material-symbols-outlined text-base text-amber-500" aria-hidden="true" style="font-variation-settings: 'FILL' 1">star</span>
            <strong class="text-on-surface dark:text-slate-200">${course.rating.toFixed(1)}</strong>
          </span>
        </div>
        <h3 class="mb-2 line-clamp-2 min-h-12 text-lg font-semibold leading-snug text-on-surface transition-colors group-hover:text-primary-container dark:text-white dark:group-hover:text-blue-400">${escapeHtml(course.title)}</h3>
        <p class="mb-4 text-body-md text-on-surface-variant dark:text-slate-400">${escapeHtml(course.instructor)}</p>

        <div class="mt-auto flex items-center justify-between gap-3 border-t border-outline-variant/50 pt-4 dark:border-slate-700">
          <div>
            <span class="block text-label-sm text-on-surface-variant dark:text-slate-400">${course.lessons} lessons</span>
            <span class="text-headline-sm font-bold text-on-surface dark:text-white">${course.price === 0 ? 'Free' : money.format(course.price)}</span>
          </div>
          <a class="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-container px-4 py-2 text-label-lg font-medium text-on-primary transition-colors hover:bg-primary" data-path="course-detail" href="/course-details.html?course=${encodeURIComponent(course.id)}">View course</a>
        </div>
      </div>
    </article>`;
}

export function init() {
  const grid = document.querySelector('#featured-course-grid');
  if (!grid) return;
  const courses = getCourses();

  // Resolve the selected IDs from the shared catalog and render their cards.
  const featuredCourses = featuredCourseIds
    .map((id) => courses.find((course) => course.id === id))
    .filter(Boolean);

  grid.innerHTML = featuredCourses
    .map((course) => renderCourseCard(course))
    .join('');

}
