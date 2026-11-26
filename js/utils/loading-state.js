const buttonStates = new WeakMap();

// Add a spinner and lock a button while its request is in progress.
export function setButtonLoading(button, isLoading, loadingLabel = '') {
  if (!button) return;

  if (isLoading) {
    if (!buttonStates.has(button)) {
      const label = button.querySelector('[data-button-label], [data-enroll-label]');
      buttonStates.set(button, {
        wasDisabled: button.disabled,
        hadAriaBusy: button.hasAttribute('aria-busy'),
        ariaBusy: button.getAttribute('aria-busy'),
        label,
        originalLabel: label?.textContent,
      });
    }

    if (!button.querySelector(':scope > .button-loading-spinner')) {
      const spinner = document.createElement('span');
      spinner.className = 'button-loading-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      button.append(spinner);
    }

    const state = buttonStates.get(button);
    if (loadingLabel && state.label?.isConnected && state.label.closest('button') === button) {
      state.label.textContent = loadingLabel;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('is-button-loading');
    return;
  }

  const state = buttonStates.get(button);
  button.querySelector(':scope > .button-loading-spinner')?.remove();
  button.classList.remove('is-button-loading');
  if (state?.label?.isConnected && state.label.closest('button') === button) {
    state.label.textContent = state.originalLabel;
  }
  button.disabled = state?.wasDisabled ?? false;
  if (state?.hadAriaBusy) button.setAttribute('aria-busy', state.ariaBusy);
  else button.removeAttribute('aria-busy');
  buttonStates.delete(button);
}

// Show an accessible indicator in a section while its initial API request runs.
export function renderLoadingIndicator(container, label) {
  if (!container) return;
  const status = document.createElement('div');
  status.className = 'page-loading-state';
  status.setAttribute('role', 'status');

  const spinner = document.createElement('span');
  spinner.className = 'button-loading-spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const message = document.createElement('span');
  message.textContent = label;
  status.append(spinner, message);
  container.replaceChildren(status);
}
