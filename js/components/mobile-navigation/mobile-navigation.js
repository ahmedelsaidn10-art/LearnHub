const menuButton = document.querySelector('#mobile-menu-btn');
const closeButton = document.querySelector('#mobile-menu-close');
const drawer = document.querySelector('#mobile-drawer');
const backdrop = document.querySelector('#mobile-drawer-backdrop');

function setMenuOpen(isOpen) {
  if (!menuButton || !drawer || !backdrop) return;

  drawer.classList.toggle('translate-x-full', !isOpen);
  backdrop.classList.toggle('opacity-0', !isOpen);
  backdrop.classList.toggle('pointer-events-none', !isOpen);
  backdrop.classList.toggle('opacity-100', isOpen);
  drawer.setAttribute('aria-hidden', String(!isOpen));
  drawer.inert = !isOpen;
  backdrop.setAttribute('aria-hidden', String(!isOpen));
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close main menu' : 'Open main menu');
  document.body.classList.toggle('overflow-hidden', isOpen);

  if (isOpen) closeButton?.focus();
  else menuButton.focus();
}

menuButton?.addEventListener('click', () => setMenuOpen(true));
closeButton?.addEventListener('click', () => setMenuOpen(false));
backdrop?.addEventListener('click', () => setMenuOpen(false));

drawer?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
  }
});

drawer?.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;

  const focusable = [...drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')];
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
