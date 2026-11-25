const root = document.documentElement;
const themeButtons = document.querySelectorAll('.theme-toggle-btn');

function readSavedTheme() {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#0b0f19' : '#faf8ff');

  themeButtons.forEach((button) => {
    button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    button.setAttribute('aria-pressed', String(isDark));

    const icon = button.querySelector('.theme-toggle-icon');
    if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  });
}

const savedTheme = readSavedTheme();
const preferredTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
applyTheme(savedTheme ?? preferredTheme);

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(nextTheme);

    try {
      localStorage.setItem('theme', nextTheme);
    } catch {
      // The selected theme still applies for this session.
    }
  });
});
