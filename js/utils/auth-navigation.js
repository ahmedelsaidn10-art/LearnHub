export function redirectToLogin() {
  const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(`/login.html?next=${encodeURIComponent(returnPath)}`);
}
