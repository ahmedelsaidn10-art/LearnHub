import template from './site-header.html?raw';
import logoUrl from '../../../assets/icons/learnhub-logo.svg?url';
import { getCurrentAccount, logoutAccount } from '../../services/auth-service.js';
import { setButtonLoading } from '../../utils/loading-state.js';

const activeLinkClasses = 'px-5 py-2 rounded-full transition-all text-primary-container bg-surface-container dark:bg-slate-700/80 dark:text-white font-label-lg text-label-lg font-semibold shadow-xs';
const defaultLinkClasses = 'px-5 py-2 rounded-full font-label-lg text-label-lg text-on-surface-variant dark:text-slate-300 hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-slate-700/50 transition-all';
const mobileActiveLinkClasses = 'flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container dark:bg-slate-800 text-primary-container dark:text-white font-label-lg text-label-lg font-semibold min-h-11';
const mobileDefaultLinkClasses = 'flex items-center justify-between px-4 py-3 rounded-xl text-on-surface-variant dark:text-slate-300 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors font-label-lg text-label-lg min-h-11';

class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered) return;
    this.innerHTML = template
      .replaceAll('/assets/icons/learnhub-logo.svg', logoUrl);
    this.dataset.rendered = 'true';
    this.updateActiveLink();
    this.loadAccount();
    const accountMenuButton = this.querySelector('[data-account-menu-toggle]');
    const accountMenu = this.querySelector('[data-account-menu]');
    accountMenuButton?.addEventListener('click', () => {
      const isOpen = accountMenuButton.getAttribute('aria-expanded') === 'true';
      accountMenuButton.setAttribute('aria-expanded', String(!isOpen));
      accountMenu?.classList.toggle('hidden', isOpen);
    });
    document.addEventListener('click', (event) => {
      const clickedInsideMenu = accountMenu?.contains(event.target) || accountMenuButton?.contains(event.target);
      if (!clickedInsideMenu) {
        accountMenu?.classList.add('hidden');
        accountMenuButton?.setAttribute('aria-expanded', 'false');
      }
    });
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && accountMenuButton?.getAttribute('aria-expanded') === 'true') {
        accountMenu?.classList.add('hidden');
        accountMenuButton.setAttribute('aria-expanded', 'false');
        accountMenuButton.focus();
      }
    });
    this.querySelectorAll('[data-logout]').forEach((button) => {
      button.addEventListener('click', async () => {
        setButtonLoading(button, true, 'Signing out...');
        try {
          await logoutAccount();
        } catch {
          // Navigate away even if the server session is already expired.
        }
        window.location.assign('/index.html');
      });
    });
  }

  async loadAccount() {
    let account;
    try {
      account = await getCurrentAccount();
    } catch {
      return;
    }
    if (!account) return;

    this.querySelectorAll('[data-guest-actions]').forEach((element) => element.classList.add('hidden'));
    this.querySelectorAll('[data-auth-actions], [data-auth-profile], [data-auth-user], [data-logout]').forEach((element) => {
      element.classList.remove('hidden');
      element.classList.add('flex');
    });
    this.querySelectorAll('[data-user-name]').forEach((element) => { element.textContent = account.name || 'LearnHub student'; });
    this.querySelectorAll('[data-user-email]').forEach((element) => { element.textContent = account.email || ''; });
    const initial = Array.from((account.name || '').trim())[0]?.toLocaleUpperCase() || 'U';
    this.querySelectorAll('[data-user-initial]').forEach((element) => { element.textContent = initial; });
  }

  updateActiveLink() {
    const file = window.location.pathname.split('/').pop() || 'index.html';
    const activePath = window.location.hash === '#about'
      ? 'about'
      : file === 'my-courses.html'
        ? 'my-courses'
      : file === 'favorites.html'
        ? 'favorites'
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



