import template from './site-header.html?raw';
import logoUrl from '../../../assets/icons/learnhub-logo.svg?url';
import profileUrl from '../../../assets/images/profile-alex.jpg?url';

const activeLinkClasses = 'px-5 py-2 rounded-full transition-all text-primary-container bg-surface-container dark:bg-slate-700/80 dark:text-white font-label-lg text-label-lg font-semibold shadow-xs';
const defaultLinkClasses = 'px-5 py-2 rounded-full font-label-lg text-label-lg text-on-surface-variant dark:text-slate-300 hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-slate-700/50 transition-all';
const mobileActiveLinkClasses = 'flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container dark:bg-slate-800 text-primary-container dark:text-white font-label-lg text-label-lg font-semibold min-h-11';
const mobileDefaultLinkClasses = 'flex items-center justify-between px-4 py-3 rounded-xl text-on-surface-variant dark:text-slate-300 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors font-label-lg text-label-lg min-h-11';

class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.innerHTML = template
      .replaceAll('/assets/icons/learnhub-logo.svg', logoUrl)
      .replaceAll('/assets/images/profile-alex.jpg', profileUrl);
    this.dataset.rendered = 'true';
    this.updateActiveLink();
  }

  updateActiveLink() {
    const file = window.location.pathname.split('/').pop() || 'index.html';
    const activePath = window.location.hash === '#about'
      ? 'about'
      : file === 'my-courses.html'
        ? 'my-courses'
      : ['courses.html', 'course-details.html'].includes(file)
        ? 'courses'
        : file === 'index.html'
          ? 'home'
          : '';

    this.querySelectorAll('nav[data-active-classes] a[data-path]').forEach((link) => {
      const isActive = link.dataset.path === activePath;
      link.className = isActive ? activeLinkClasses : defaultLinkClasses;
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    this.querySelectorAll('nav[aria-label="Mobile Secondary Links"] a[data-path]').forEach((link) => {
      const isActive = link.dataset.path === activePath;
      link.className = isActive ? mobileActiveLinkClasses : mobileDefaultLinkClasses;
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}

customElements.define('site-header', SiteHeader);



