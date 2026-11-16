import { loginAccount } from '../services/auth-service.js';

function init() {
  const form = document.querySelector('#login-form');
  if (!form) return;

  const emailInput = form.elements.email;
  const passwordInput = form.elements.password;
  const errorBanner = document.querySelector('#login-error-banner');
  const errorMessage = document.querySelector('#login-error-message');
  const successBanner = document.querySelector('#login-success-banner');
  const submitButton = document.querySelector('#login-submit');
  const fields = [
    {
      input: emailInput,
      error: document.querySelector('#login-email-error'),
      validate: () => emailInput.validity.valid ? '' : 'Enter a valid email address.',
    },
    {
      input: passwordInput,
      error: document.querySelector('#login-password-error'),
      validate: () => passwordInput.value ? '' : 'Enter your password.',
    },
  ];

  function validateField(field) {
    const message = field.validate();
    field.error.textContent = message;
    field.input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }

  function validateForm() {
    let firstInvalid = null;
    let valid = true;
    fields.forEach((field) => {
      const fieldIsValid = validateField(field);
      valid = fieldIsValid && valid;
      if (!fieldIsValid && !firstInvalid) firstInvalid = field.input;
    });
    firstInvalid?.focus();
    return valid;
  }

  fields.forEach((field) => {
    field.input.addEventListener('blur', () => validateField(field));
    field.input.addEventListener('input', () => {
      if (field.input.getAttribute('aria-invalid') === 'true') validateField(field);
      errorBanner.hidden = true;
    });
  });

  document.querySelector('[data-password-toggle="login-password"]').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const visible = passwordInput.type === 'password';
    passwordInput.type = visible ? 'text' : 'password';
    button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} password`);
    button.querySelector('.material-symbols-outlined').textContent = visible ? 'visibility_off' : 'visibility';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBanner.hidden = true;
    successBanner.hidden = true;
    if (!validateForm()) return;

    submitButton.disabled = true;
    submitButton.classList.add('is-loading');
    submitButton.setAttribute('aria-busy', 'true');
    try {
      const result = await loginAccount({
        email: emailInput.value,
        password: passwordInput.value,
        rememberMe: form.elements.rememberMe.checked,
      });
      if (!result || typeof result !== 'object') {
        throw new Error('The sign-in API is not connected yet.');
      }
      passwordInput.value = '';
      successBanner.hidden = false;
      window.setTimeout(() => window.location.assign('/my-courses.html'), 900);
    } catch (error) {
      errorMessage.textContent = error.message || 'We could not sign you in. Check your details and try again.';
      errorBanner.hidden = false;
      errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
      submitButton.removeAttribute('aria-busy');
    }
  });
}

export { init };
