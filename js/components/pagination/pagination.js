const buttonBase = 'inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-3 text-label-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40';
const pageBase = 'bg-surface-container-lowest text-on-surface hover:bg-surface-container dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
const activePage = 'bg-primary-container text-white shadow-sm';

function pageSequence(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  if (currentPage <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (currentPage >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

export function createPagination(container, onPageChange, label = 'Course pages') {
  if (!container) return () => {};

  container.setAttribute('aria-label', label);
  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    onPageChange(Number(button.dataset.page));
  });

  return ({ page, totalPages }) => {
    if (totalPages <= 1) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    const pages = pageSequence(page, totalPages);
    let previousPage = 0;
    const pageButtons = pages.map((pageNumber) => {
      const gap = previousPage && pageNumber - previousPage > 1
        ? '<span class="px-1 text-label-sm text-on-surface-variant" aria-hidden="true">...</span>'
        : '';
      previousPage = pageNumber;
      const isActive = pageNumber === page;
      return `${gap}<button class="${buttonBase} ${isActive ? activePage : pageBase}" type="button" data-page="${pageNumber}" aria-label="Page ${pageNumber}" ${isActive ? 'aria-current="page"' : ''}>${pageNumber}</button>`;
    }).join('');

    container.innerHTML = `
      <button class="${buttonBase} ${pageBase} gap-1" type="button" data-page="${page - 1}" aria-label="Previous page" ${page === 1 ? 'disabled' : ''}>
        <span class="material-symbols-outlined text-lg" aria-hidden="true">chevron_left</span><span class="hidden sm:inline">Previous</span>
      </button>
      <div class="flex items-center gap-1.5" aria-label="Page numbers">${pageButtons}</div>
      <button class="${buttonBase} ${pageBase} gap-1" type="button" data-page="${page + 1}" aria-label="Next page" ${page === totalPages ? 'disabled' : ''}>
        <span class="hidden sm:inline">Next</span><span class="material-symbols-outlined text-lg" aria-hidden="true">chevron_right</span>
      </button>`;
  };
}

export function getPageRange(page, pageSize, totalItems) {
  if (!totalItems) return { start: 0, end: 0 };
  return {
    start: ((page - 1) * pageSize) + 1,
    end: Math.min(page * pageSize, totalItems),
  };
}
