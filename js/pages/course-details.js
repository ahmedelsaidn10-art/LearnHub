import { getCourseById } from '../services/course-service.js';
import { getCurrentAccount } from '../services/auth-service.js';
import {
  addCourseToMyCourses,
  addCourseToFavorites,
  getFavorites,
  getMyCourses,
  removeCourseFromFavorites,
  removeCourseFromMyCourses,
  updateLessonProgress,
} from '../services/learning-service.js';
import { redirectToLogin } from '../utils/auth-navigation.js';
import { setButtonLoading } from '../utils/loading-state.js';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function courseDetails(course) {
  const details = course.details || {};
  return {
    ...details,
    description: details.description || `Build practical ${course.category.toLowerCase()} skills with ${course.title}. Follow guided lessons, practice the core ideas, and finish with a project.`,
    instructorTitle: details.instructorTitle || 'Course instructor',
    updatedAt: details.updatedAt || 'Recently updated',
    language: details.language || 'English',
    subtitles: Array.isArray(details.subtitles) ? details.subtitles : [],
    repositoryCount: Number(details.repositoryCount) || 0,
    projectCount: Number(details.projectCount) || 1,
    outcomes: Array.isArray(details.outcomes) && details.outcomes.length ? details.outcomes : [
      `Understand the core concepts covered in ${course.title}.`,
      `Apply ${course.category.toLowerCase()} techniques in guided exercises.`,
      'Complete a practical project to reinforce what you learned.',
    ],
    requirements: Array.isArray(details.requirements) ? details.requirements : [],
    curriculum: Array.isArray(details.curriculum) ? details.curriculum : [],
  };
}

function curriculumMarkup(sections, completedLessons, canTrackProgress) {
  return sections.map((section, index) => `
    <details class="curriculum-section overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest dark:border-slate-700 dark:bg-slate-900" ${index === 0 ? 'open' : ''}>
      <summary class="flex cursor-pointer list-none items-center justify-between gap-4 bg-surface-container-low px-5 py-4 transition hover:bg-surface-container dark:bg-slate-800/70 dark:hover:bg-slate-800">
        <span class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-label-lg font-bold text-primary dark:bg-primary/20 dark:text-blue-300">${index + 1}</span>
          <span class="font-semibold text-on-surface dark:text-white">${escapeHtml(section.title)}</span>
        </span>
        <span class="flex shrink-0 items-center gap-3 text-label-sm text-on-surface-variant dark:text-slate-400">
          <span>${section.lessons.length} lessons</span>
          <span class="material-symbols-outlined curriculum-chevron transition-transform" aria-hidden="true">expand_more</span>
        </span>
      </summary>
      <ul class="grid gap-3 px-5 py-4 sm:grid-cols-2">
        ${section.lessons.map((lesson) => {
          const lessonTitle = typeof lesson === 'string' ? lesson : lesson.title;
          const lessonId = typeof lesson === 'string' ? '' : String(lesson.id);
          const isDone = completedLessons.has(lessonId);
          const button = canTrackProgress && lessonId
            ? `<button class="lesson-done-button shrink-0 rounded-lg border px-3 py-1.5 text-label-sm font-semibold transition ${isDone ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-300'}" type="button" data-lesson-id="${escapeHtml(lessonId)}" aria-pressed="${isDone}" aria-label="${isDone ? 'Mark as not done' : 'Mark as done'}: ${escapeHtml(lessonTitle)}"><span data-button-label>${isDone ? 'Done ?' : 'Done'}</span></button>`
            : '';
          return `<li class="flex items-center gap-2 text-body-md text-on-surface-variant dark:text-slate-300">
            <span class="material-symbols-outlined text-base ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary dark:text-blue-300'}" aria-hidden="true">${isDone ? 'check_circle' : 'play_circle'}</span>
            <span class="min-w-0 flex-1">${escapeHtml(lessonTitle)}</span>${button}
          </li>`;
        }).join('')}
      </ul>
    </details>`).join('');
}

function pageMarkup(course, completedLessons) {
  const details = courseDetails(course);
  const lessonCount = details.curriculum.reduce((total, section) => total + section.lessons.length, 0);
  const completionPercent = lessonCount ? Math.round((completedLessons.size / lessonCount) * 100) : 0;
  const price = course.price === 0 ? 'Free' : currency.format(course.price);
  const subtitles = details.subtitles.length ? `CC: ${escapeHtml(details.subtitles.join(', '))}` : 'Subtitles available';
  const benefits = [
    `${escapeHtml(course.duration)} of on-demand learning`,
    ...(details.repositoryCount ? [`${details.repositoryCount} downloadable code resources`] : []),
    `${details.projectCount} practical ${details.projectCount === 1 ? 'project' : 'projects'}`,
    'Lifetime access to course materials',
    'Certificate of completion',
  ];

  return `
    <!-- Course identity and overview -->
    <section class="border-b border-outline-variant/40 bg-surface-container-low dark:border-slate-800 dark:bg-[#070b14]/70">
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav class="mb-6 flex items-center gap-2 text-label-sm text-on-surface-variant dark:text-slate-400" aria-label="Breadcrumb">
          <a class="hover:text-primary dark:hover:text-blue-300" href="/courses.html">Courses</a>
          <span class="material-symbols-outlined text-base" aria-hidden="true">chevron_right</span>
          <span>${escapeHtml(course.category)}</span>
        </nav>

        <div class="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div class="lg:col-span-7">
            <span class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-label-sm font-semibold uppercase tracking-wide text-primary dark:bg-primary/20 dark:text-blue-300">
              <span class="material-symbols-outlined text-base" aria-hidden="true">school</span>${escapeHtml(course.category)} · ${escapeHtml(course.level)}
            </span>
            <h1 class="mb-4 text-3xl font-bold tracking-tight text-on-surface dark:text-white sm:text-4xl lg:text-[40px] lg:leading-tight">${escapeHtml(course.title)}</h1>
            <p class="mb-6 max-w-3xl text-base leading-relaxed text-on-surface-variant dark:text-slate-300 sm:text-lg">${escapeHtml(details.description)}</p>

            <div class="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-label-sm text-on-surface-variant dark:text-slate-400">
              <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-amber-500" aria-hidden="true" style="font-variation-settings:'FILL' 1">star</span><strong class="text-on-surface dark:text-white">${course.rating.toFixed(1)}</strong><span>(${(course.reviewCount ?? course.students).toLocaleString()} ratings)</span></span>
              <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-base" aria-hidden="true">group</span>${course.students.toLocaleString()} learners</span>
              <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-base" aria-hidden="true">update</span>Updated ${escapeHtml(details.updatedAt)}</span>
            </div>

            <div class="flex flex-wrap items-center gap-3 text-label-lg">
              <img class="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20" src="${escapeHtml(course.instructorImage)}" alt="" />
              <span class="text-on-surface-variant dark:text-slate-300">Created by <strong class="text-primary dark:text-blue-300">${escapeHtml(course.instructor)}</strong></span>
              <span class="text-on-surface-variant dark:text-slate-400">${escapeHtml(details.instructorTitle)}</span>
            </div>
          </div>

          <!-- Preview image and a clear affordance for the course trailer -->
          <div class="relative lg:col-span-5">
            <div class="group relative aspect-video overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
              <img class="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105" src="${escapeHtml(course.image)}" alt="${escapeHtml(course.category)} course preview" />
              <div class="absolute inset-0 bg-linear-to-t from-slate-950/75 via-transparent to-slate-950/10"></div>
              <button id="preview-play-btn" class="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-container/95 text-white shadow-xl transition hover:scale-110 hover:bg-primary focus-visible:outline-white sm:h-20 sm:w-20" type="button" aria-label="Play course preview">
                <span class="material-symbols-outlined text-4xl" aria-hidden="true">play_arrow</span>
              </button>
              <span class="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1.5 text-label-sm font-medium text-white backdrop-blur">Course preview</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main learning information with a sticky enrollment summary on desktop -->
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-12 lg:px-8">
      <div class="space-y-10 lg:col-span-8">
        <section aria-labelledby="outcomes-heading">
          <h2 id="outcomes-heading" class="mb-5 flex items-center gap-2 text-headline-md font-bold text-on-surface dark:text-white"><span class="material-symbols-outlined text-primary dark:text-blue-300" aria-hidden="true">checklist</span>What you will learn</h2>
          <ul class="grid gap-4 rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 sm:p-6">
            ${details.outcomes.map((item) => `<li class="flex items-start gap-3 text-body-md leading-relaxed text-on-surface-variant dark:text-slate-300"><span class="material-symbols-outlined mt-0.5 text-lg text-primary dark:text-blue-300" aria-hidden="true">check_circle</span><span>${escapeHtml(item)}</span></li>`).join('')}
          </ul>
        </section>

        <section aria-labelledby="curriculum-heading">
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="curriculum-heading" class="text-headline-md font-bold text-on-surface dark:text-white">Course curriculum</h2>
              <p class="mt-1 text-body-md text-on-surface-variant dark:text-slate-400">${details.curriculum.length} sections · ${lessonCount} lessons · ${escapeHtml(course.duration)} total</p>
            </div>
            <button id="curriculum-toggle-all" class="rounded-xl px-3 py-2 text-label-lg font-semibold text-primary transition hover:bg-primary/10 dark:text-blue-300" type="button" aria-expanded="false">Expand all</button>
          </div>
          <div class="mb-5 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-4 dark:border-slate-800 dark:bg-slate-900/70" aria-label="Your course progress">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-label-lg">
              <span class="font-semibold text-on-surface dark:text-white">Your progress</span>
              <span class="text-on-surface-variant dark:text-slate-400"><strong id="completed-lesson-count" class="text-on-surface dark:text-white">${completedLessons.size}</strong> of <span id="total-lesson-count">${lessonCount}</span> lessons · <strong id="course-progress-percent" class="text-primary dark:text-blue-300">${completionPercent}%</strong></span>
            </div>
            <div id="course-progress-bar" class="h-2.5 overflow-hidden rounded-full bg-surface-container-high dark:bg-slate-700" role="progressbar" aria-label="Course completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${completionPercent}">
              <div id="course-progress-fill" class="h-full rounded-full bg-primary transition-all duration-300 dark:bg-blue-400" style="width: ${completionPercent}%"></div>
            </div>
          </div>
          ${course.is_enrolled ? '' : '<p class="mb-4 rounded-xl bg-primary/5 p-3 text-sm text-on-surface-variant dark:bg-primary/10 dark:text-slate-300">Add this course to My Courses to track lesson completion.</p>'}
          <div id="curriculum-list" class="space-y-3">${curriculumMarkup(details.curriculum, completedLessons, Boolean(course.is_enrolled))}</div>
        </section>

        <section aria-labelledby="requirements-heading">
          <h2 id="requirements-heading" class="mb-4 text-headline-md font-bold text-on-surface dark:text-white">Requirements</h2>
          <ul class="list-inside list-disc space-y-2 rounded-3xl bg-surface-container-low p-5 text-body-md leading-relaxed text-on-surface-variant dark:bg-slate-900/70 dark:text-slate-300 sm:p-6">
            ${details.requirements.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </section>

        <section aria-labelledby="instructor-heading">
          <h2 id="instructor-heading" class="mb-5 text-headline-md font-bold text-on-surface dark:text-white">Meet your instructor</h2>
          <div class="flex flex-col gap-5 rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:p-6">
            <img class="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-sm ring-4 ring-primary/10" src="${escapeHtml(course.instructorImage)}" alt="" loading="lazy" />
            <div>
              <h3 class="text-headline-sm font-bold text-on-surface dark:text-white">${escapeHtml(course.instructor)}</h3>
              <p class="mb-3 text-label-lg font-medium text-primary dark:text-blue-300">${escapeHtml(details.instructorTitle)}</p>
              <p class="text-body-md leading-relaxed text-on-surface-variant dark:text-slate-300">Learn from an experienced instructor through practical lessons, clear explanations, and projects based on real-world workflows.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="rating-heading" class="rounded-3xl border border-outline-variant/50 bg-surface-container-low p-5 dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
          <h2 id="rating-heading" class="mb-4 text-headline-md font-bold text-on-surface dark:text-white">Learner rating</h2>
          <div class="flex flex-wrap items-center gap-4">
            <span class="text-5xl font-bold text-on-surface dark:text-white">${course.rating.toFixed(1)}</span>
            <div>
              <div class="mb-1 flex text-amber-500" aria-label="Rated ${course.rating.toFixed(1)} out of 5">
                ${Array.from({ length: 5 }, () => '<span class="material-symbols-outlined" aria-hidden="true" style="font-variation-settings:\'FILL\' 1">star</span>').join('')}
              </div>
              <p class="text-body-md text-on-surface-variant dark:text-slate-400">Course rating based on ${(course.reviewCount ?? course.students).toLocaleString()} ratings</p>
            </div>
          </div>
        </section>
      </div>

      <!-- Enrollment card stays visible beside the curriculum on large screens -->
      <aside class="lg:col-span-4">
        <div class="space-y-5 lg:sticky lg:top-24">
          <section class="overflow-hidden rounded-3xl border border-outline-variant/50 bg-surface-container-lowest shadow-lg dark:border-slate-800 dark:bg-slate-900" aria-label="Enroll in this course">
            <div class="p-5 sm:p-6">
              <div class="mb-5 flex items-end gap-3">
                <span class="text-4xl font-bold text-on-surface dark:text-white">${price}</span>
                <span class="pb-1 text-body-md text-on-surface-variant dark:text-slate-400">one-time purchase</span>
              </div>
              <button id="enroll-toggle-btn" class="mb-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-5 py-4 text-label-lg font-bold text-white shadow-md transition hover:bg-primary active:scale-[0.99]" type="button">
                <span class="material-symbols-outlined" aria-hidden="true">school</span><span data-enroll-label>Add to My Courses</span>
              </button>
              <p class="mb-5 text-center text-label-sm text-on-surface-variant dark:text-slate-400">Add this course to your learning list. No payment is processed here.</p>

              <h3 class="mb-3 text-label-lg font-bold text-on-surface dark:text-white">This course includes:</h3>
              <ul class="space-y-3">
                ${benefits.map((item) => `<li class="flex items-start gap-2.5 text-body-md text-on-surface-variant dark:text-slate-300"><span class="material-symbols-outlined text-lg text-primary dark:text-blue-300" aria-hidden="true">check</span><span>${item}</span></li>`).join('')}
                <li class="flex items-start gap-2.5 text-body-md text-on-surface-variant dark:text-slate-300"><span class="material-symbols-outlined text-lg text-primary dark:text-blue-300" aria-hidden="true">translate</span><span>${escapeHtml(details.language)} audio · ${subtitles} subtitles</span></li>
              </ul>

              <div class="mt-6 flex items-center justify-between border-t border-outline-variant/50 pt-4 dark:border-slate-700">
                <button id="share-course-btn" class="inline-flex items-center gap-2 rounded-lg py-2 text-label-lg font-medium text-on-surface-variant transition hover:text-primary dark:text-slate-300 dark:hover:text-blue-300" type="button">
                  <span class="material-symbols-outlined text-lg" aria-hidden="true">share</span><span id="share-label">Share course</span>
                </button>
                <button id="wishlist-btn" class="inline-flex items-center gap-2 rounded-lg py-2 text-label-lg font-medium text-on-surface-variant transition hover:text-error dark:text-slate-300" type="button" aria-pressed="false">
                  <span id="wishlist-icon" class="material-symbols-outlined text-lg" aria-hidden="true">favorite_border</span><span id="wishlist-label">Save to wishlist</span>
                </button>
              </div>
            </div>
          </section>

          <div class="flex gap-3 rounded-2xl bg-primary/5 p-4 dark:bg-primary/10">
            <span class="material-symbols-outlined text-2xl text-primary dark:text-blue-300" aria-hidden="true">verified_user</span>
            <p class="text-body-md leading-relaxed text-on-surface-variant dark:text-slate-300">Learn at your own pace with lifetime access to the course materials.</p>
          </div>
        </div>
      </aside>
    </div>

    <!-- Keep the enrollment action available on small screens while scrolling. -->
    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/60 bg-surface-container-lowest/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-1">
        <div class="min-w-0">
          <span class="block text-label-sm text-on-surface-variant dark:text-slate-400">Course price</span>
          <strong class="text-headline-sm text-on-surface dark:text-white">${price}</strong>
        </div>
        <button id="mobile-enroll-btn" class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 text-label-lg font-bold text-white shadow-sm transition hover:bg-primary sm:max-w-xs" type="button" aria-pressed="false">
          <span class="material-symbols-outlined" aria-hidden="true">school</span><span data-enroll-label>Add to My Courses</span>
        </button>
      </div>
    </div>
    <div class="h-20 lg:hidden" aria-hidden="true"></div>
  `;
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

function updateEnrollment(button, isEnrolled) {
  button.setAttribute('aria-pressed', String(isEnrolled));
  button.setAttribute('aria-label', isEnrolled ? 'Remove this course from My Courses' : 'Add this course to My Courses');
  const label = button.querySelector('[data-enroll-label]');
  if (label) label.textContent = isEnrolled ? 'Added to My Courses' : 'Add to My Courses';

  const icon = button.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = isEnrolled ? 'check_circle' : 'school';

  // Use a success color and checkmark to make the saved state easy to recognize.
  button.classList.toggle('bg-emerald-600', isEnrolled);
  button.classList.toggle('hover:bg-emerald-700', isEnrolled);
  button.classList.toggle('bg-primary-container', !isEnrolled);
  button.classList.toggle('hover:bg-primary', !isEnrolled);
}

function updateLessonButton(button, isDone) {
  button.setAttribute('aria-pressed', String(isDone));
  button.setAttribute('aria-label', `${isDone ? 'Mark as not done' : 'Mark as done'}: ${button.closest('li')?.querySelector('span.flex-1')?.textContent.trim() || 'lesson'}`);
  const label = button.querySelector('[data-button-label]');
  if (label) label.textContent = isDone ? 'Done ✓' : 'Done';
  else button.textContent = isDone ? 'Done ✓' : 'Done';

  const completedClasses = ['border-emerald-600', 'bg-emerald-600', 'text-white', 'hover:bg-emerald-700'];
  const pendingClasses = ['border-outline-variant', 'text-on-surface-variant', 'hover:border-primary', 'hover:text-primary', 'dark:border-slate-600', 'dark:text-slate-300', 'dark:hover:border-blue-400', 'dark:hover:text-blue-300'];
  completedClasses.forEach((className) => button.classList.toggle(className, isDone));
  pendingClasses.forEach((className) => button.classList.toggle(className, !isDone));

  const icon = button.closest('li')?.querySelector('.material-symbols-outlined');
  if (icon) {
    icon.textContent = isDone ? 'check_circle' : 'play_circle';
    icon.classList.toggle('text-emerald-600', isDone);
    icon.classList.toggle('dark:text-emerald-400', isDone);
    icon.classList.toggle('text-primary', !isDone);
    icon.classList.toggle('dark:text-blue-300', !isDone);
  }
}

function updateProgressDisplay(root, completedCount, totalCount) {
  const percent = totalCount ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;
  root.querySelector('#completed-lesson-count').textContent = String(completedCount);
  root.querySelector('#course-progress-percent').textContent = `${percent}%`;
  root.querySelector('#course-progress-bar').setAttribute('aria-valuenow', String(percent));
  root.querySelector('#course-progress-fill').style.width = `${percent}%`;
}

function renderNotFound(root) {
  root.setAttribute('aria-busy', 'false');
  root.innerHTML = `
    <span class="material-symbols-outlined mb-3 text-5xl text-outline" aria-hidden="true">search_off</span>
    <h1 class="mb-3 text-headline-md font-bold text-on-surface dark:text-white">Course not found</h1>
    <p class="mb-6 text-body-md text-on-surface-variant dark:text-slate-400">Choose a course from the catalog to see its details.</p>
    <a class="inline-flex min-h-11 items-center rounded-xl bg-primary-container px-5 py-2.5 text-label-lg font-semibold text-white hover:bg-primary" href="/courses.html">Browse courses</a>`;
}

// Bind page-only behaviors after rendering the selected course.
export async function init() {
  const root = document.querySelector('#course-details-root');
  if (!root) return;

  const courseId = new URLSearchParams(window.location.search).get('course');
  if (!courseId) {
    renderNotFound(root);
    return;
  }

  let course;
  try {
    course = await getCourseById(courseId);
  } catch (error) {
    root.setAttribute('aria-busy', 'false');
    root.innerHTML = `
      <span class="material-symbols-outlined mb-3 text-5xl text-outline" aria-hidden="true">cloud_off</span>
      <h1 class="mb-3 text-headline-md font-bold text-on-surface dark:text-white">Could not load this course</h1>
      <p class="mb-6 text-body-md text-on-surface-variant dark:text-slate-400">${escapeHtml(error.message || 'Check your connection and try again.')}</p>
      <a class="inline-flex min-h-11 items-center rounded-xl bg-primary-container px-5 py-2.5 text-label-lg font-semibold text-white hover:bg-primary" href="/courses.html">Browse courses</a>`;
    return;
  }
  if (!course) {
    renderNotFound(root);
    return;
  }

  let account = null;
  try {
    account = await getCurrentAccount();
  } catch (error) {
    if (error.status !== 401) showToast(error.message || 'Your account status could not be loaded.');
  }
  let isFavorite = false;
  if (account) {
    try {
      isFavorite = (await getFavorites()).some((favorite) => favorite.id === course.id);
    } catch (error) {
      if (error.status !== 401) showToast(error.message || 'Your favorites could not be loaded.');
    }

    try {
      const enrolledCourse = (await getMyCourses()).find((item) => item.id === course.id);
      course.is_enrolled = Boolean(enrolledCourse);
      if (enrolledCourse?.details?.curriculum?.length) {
        course.details = { ...course.details, curriculum: enrolledCourse.details.curriculum };
      }
    } catch (error) {
      if (error.status === 401) return redirectToLogin();
      showToast(error.message || 'Your enrollment status could not be loaded.');
    }
  }

  document.title = `${course.title} ? LearnHub`;
  const details = courseDetails(course);
  const completedLessons = new Set(details.curriculum.flatMap((section) => section.lessons)
    .filter((lesson) => typeof lesson !== 'string' && lesson.completed === true)
    .map((lesson) => String(lesson.id)));
  const totalLessons = details.curriculum.reduce((total, section) => total + section.lessons.length, 0);
  root.innerHTML = pageMarkup(course, completedLessons);
  root.className = '';
  root.setAttribute('aria-busy', 'false');

  root.querySelector('#curriculum-list').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-lesson-id]');
    if (!button) return;
    if (!course.is_enrolled) {
      if (!account) redirectToLogin();
      else showToast('Add this course to My Courses before marking lessons done.');
      return;
    }

    const lessonId = button.dataset.lessonId;
    const isDone = completedLessons.has(lessonId);
    setButtonLoading(button, true, 'Saving...');
    try {
      const result = await updateLessonProgress(course.id, lessonId, !isDone);
      if (isDone) completedLessons.delete(lessonId);
      else completedLessons.add(lessonId);
      const lesson = details.curriculum.flatMap((section) => section.lessons)
        .find((item) => typeof item !== 'string' && String(item.id) === lessonId);
      if (lesson) lesson.completed = !isDone;
      updateLessonButton(button, !isDone);
      const progress = result?.progress || {};
      updateProgressDisplay(root, Number(progress.completedLessons) || completedLessons.size, Number(progress.totalLessons) || totalLessons);
    } catch (error) {
      if (error.status === 401) redirectToLogin();
      else showToast(error.message || 'Could not save lesson progress.');
    } finally {
      setButtonLoading(button, false);
      updateLessonButton(button, completedLessons.has(lessonId));
    }
  });

  const curriculumSections = [...root.querySelectorAll('.curriculum-section')];
  const toggleAll = root.querySelector('#curriculum-toggle-all');
  const updateToggleAll = () => {
    const allOpen = curriculumSections.every((section) => section.open);
    toggleAll.textContent = allOpen ? 'Collapse all' : 'Expand all';
    toggleAll.setAttribute('aria-expanded', String(allOpen));
  };
  curriculumSections.forEach((section) => section.addEventListener('toggle', updateToggleAll));
  toggleAll.addEventListener('click', () => {
    const shouldOpen = curriculumSections.some((section) => !section.open);
    curriculumSections.forEach((section) => { section.open = shouldOpen; });
    updateToggleAll();
  });
  updateToggleAll();

  const enrollButtons = [root.querySelector('#enroll-toggle-btn'), root.querySelector('#mobile-enroll-btn')].filter(Boolean);
  const removeDialog = document.querySelector('#remove-enrollment-dialog');
  const cancelRemoveButton = document.querySelector('#cancel-remove-enrollment');
  const confirmRemoveButton = document.querySelector('#confirm-remove-enrollment');
  const removeMessage = document.querySelector('#remove-enrollment-message');
  let pendingEnrollmentRemoval = false;
  enrollButtons.forEach((button) => updateEnrollment(button, Boolean(course.is_enrolled)));
  const saveEnrollment = async (action) => {
    enrollButtons.forEach((item) => setButtonLoading(item, true, action === 'add' ? 'Adding...' : 'Removing...'));
    try {
      if (action === 'remove') await removeCourseFromMyCourses(course.id);
      else await addCourseToMyCourses(course.id);
      course.is_enrolled = action === 'add';
      window.location.reload();
      return true;
    } catch (error) {
      if (error.status === 401) redirectToLogin();
      else showToast(error.message || 'Could not update My Courses.');
      return false;
    } finally {
      enrollButtons.forEach((item) => {
        setButtonLoading(item, false);
        updateEnrollment(item, Boolean(course.is_enrolled));
      });
    }
  };
  const handleEnrollment = async () => {
    if (!account) return redirectToLogin();
    if (!course.is_enrolled) return saveEnrollment('add');
    if (!removeDialog) return;
    removeMessage.textContent = `${course.title} and its saved lesson progress will be removed from My Courses. If you add it again, progress starts over.`;
    pendingEnrollmentRemoval = true;
    removeDialog.showModal();
  };
  enrollButtons.forEach((button) => button.addEventListener('click', handleEnrollment));
  cancelRemoveButton?.addEventListener('click', () => {
    pendingEnrollmentRemoval = false;
    removeDialog.close();
  });
  confirmRemoveButton?.addEventListener('click', async () => {
    if (!pendingEnrollmentRemoval) return;
    setButtonLoading(confirmRemoveButton, true, 'Removing...');
    const removed = await saveEnrollment('remove');
    if (removed) {
      pendingEnrollmentRemoval = false;
      removeDialog.close();
    }
    setButtonLoading(confirmRemoveButton, false);
  });
  removeDialog?.addEventListener('click', (event) => {
    if (event.target === removeDialog) {
      pendingEnrollmentRemoval = false;
      removeDialog.close();
    }
  });

  const wishlistButton = root.querySelector('#wishlist-btn');
  const wishlistIcon = root.querySelector('#wishlist-icon');
  const wishlistLabel = root.querySelector('#wishlist-label');
  const updateWishlist = () => {
    wishlistButton.setAttribute('aria-pressed', String(isFavorite));
    wishlistIcon.textContent = isFavorite ? 'favorite' : 'favorite_border';
    wishlistIcon.style.fontVariationSettings = isFavorite ? "'FILL' 1" : "'FILL' 0";
    wishlistLabel.textContent = isFavorite ? 'Saved in wishlist' : 'Save to wishlist';
    wishlistButton.classList.toggle('text-error', isFavorite);
  };
  updateWishlist();
  wishlistButton.addEventListener('click', async () => {
    if (!account) return redirectToLogin();
    setButtonLoading(wishlistButton, true, 'Saving...');
    try {
      if (isFavorite) await removeCourseFromFavorites(course.id);
      else await addCourseToFavorites(course.id);
      isFavorite = !isFavorite;
      updateWishlist();
      showToast(isFavorite ? 'Course added to favorites.' : 'Course removed from favorites.');
    } catch (error) {
      if (error.status === 401) redirectToLogin();
      else showToast(error.message || 'Could not update favorites.');
    } finally {
      setButtonLoading(wishlistButton, false);
    }
  });

  root.querySelector('#share-course-btn').addEventListener('click', async () => {
    const shareData = { title: course.title, text: `Explore ${course.title} on LearnHub.`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        root.querySelector('#share-label').textContent = 'Link copied';
        window.setTimeout(() => { root.querySelector('#share-label').textContent = 'Share course'; }, 2500);
        showToast('Course link copied.');
      } else showToast(`Share this course: ${window.location.href}`);
    } catch (error) {
      if (error.name !== 'AbortError') showToast('Could not share the course link.');
    }
  });
  root.querySelector('#preview-play-btn').addEventListener('click', () => showToast('A course preview video is not available yet.'));
}
