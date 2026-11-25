const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function courseCardMarkup(course, favoriteIds = new Set()) {
  const courseId = String(course.id);
  const isFavorite = favoriteIds.has(courseId);
  const badge = course.label
    ? `<span class="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-3 py-1 text-label-sm font-semibold text-on-surface shadow-sm dark:bg-slate-900/90 dark:text-white">${escapeHtml(course.label)}</span>`
    : '';
  const rating = Number(course.rating) || 0;
  const students = Number(course.students) || 0;
  const lessons = Number(course.lessons) || 0;
  const price = Number(course.price) || 0;

  return `
    <article class="course-card group flex h-full flex-col overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-[#111827]">
      <div class="relative aspect-16/10 overflow-hidden bg-surface-container dark:bg-slate-800">
        <img class="h-full w-full object-cover transition duration-500 group-hover:scale-105" src="${escapeHtml(course.image)}" alt="${escapeHtml(course.category)} course preview" loading="lazy" />
        ${badge}
        <button class="favorite-course absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-error shadow-sm backdrop-blur transition hover:scale-105 dark:bg-slate-900/90 dark:text-red-400" type="button" data-course-id="${escapeHtml(courseId)}" aria-label="${isFavorite ? 'Remove from' : 'Add to'} favorites: ${escapeHtml(course.title)}" aria-pressed="${isFavorite}">
          <span class="material-symbols-outlined text-xl" aria-hidden="true" style="font-variation-settings: 'FILL' ${isFavorite ? 1 : 0}">${isFavorite ? 'favorite' : 'favorite_border'}</span>
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
          <strong class="text-on-surface dark:text-slate-200">${rating.toFixed(1)}</strong>
          <span>(${students.toLocaleString()} learners)</span>
        </div>

        <div class="mb-5 flex items-center gap-2 border-b border-outline-variant/50 pb-4 dark:border-slate-700">
          <img class="h-9 w-9 rounded-full object-cover" src="${escapeHtml(course.instructorImage)}" alt="" loading="lazy" />
          <span class="text-label-lg text-on-surface-variant dark:text-slate-300">${escapeHtml(course.instructor)}</span>
        </div>

        <div class="mt-auto flex items-center justify-between gap-3">
          <div>
            <p class="text-label-sm text-on-surface-variant dark:text-slate-400">${lessons} lessons <span aria-hidden="true">·</span> ${escapeHtml(course.duration)}</p>
            <p class="mt-0.5 text-headline-sm font-bold text-on-surface dark:text-white">${price === 0 ? 'Free' : money.format(price)}</p>
          </div>
          <a class="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-container px-4 py-2 text-label-lg font-semibold text-white shadow-sm transition hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/course-details.html?course=${encodeURIComponent(courseId)}">View course</a>
        </div>
      </div>
    </article>`;
}
