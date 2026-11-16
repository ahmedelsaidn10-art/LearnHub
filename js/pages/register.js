import { registerAccount } from '../services/auth-service.js';

const fieldRules = [
  { input: 'register-name', error: 'name-error', validate: (value) => value.trim().length >= 2 ? '' : 'Enter your full name (at least 2 characters).' },
  { input: 'register-email', error: 'email-error', validate: (value, input) => input.validity.valid ? '' : 'Enter a valid email address.' },
  { input: 'register-password', error: 'password-error', validate: (value) => value.length >= 8 ? '' : 'Use at least 8 characters.' },
  { input: 'register-confirm-password', error: 'confirm-password-error', validate: (value, input, form) => value && value === form.elements.password.value ? '' : 'Passwords do not match.' },
  { input: 'register-terms', error: 'terms-error', validate: (_value, input) => input.checked ? '' : 'Please accept the terms to continue.' },
];

function init() {
  const form = document.querySelector('#registration-form');
  if (!form) return;

  const submitButton = document.querySelector('#register-submit');
  const errorBanner = document.querySelector('#register-error-banner');
  const errorMessage = document.querySelector('#register-error-message');
  const successBanner = document.querySelector('#register-success-banner');
  const passwordInput = form.elements.password;
  const confirmInput = form.elements.confirmPassword;

  function showFieldError(rule, show) {
    const input = document.getElementById(rule.input);
    const error = document.getElementById(rule.error);
    const message = show ? rule.validate(input.type === 'checkbox' ? input.checked : input.value, input, form) : '';
    error.textContent = message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }

  function validateForm() {
    let firstInvalid = null;
    let valid = true;
    fieldRules.forEach((rule) => {
      const isValid = showFieldError(rule, true);
      valid = isValid && valid;
      if (!isValid && !firstInvalid) firstInvalid = document.getElementById(rule.input);
    });
    firstInvalid?.focus();
    return valid;
  }

  function updatePasswordStrength() {
    const value = passwordInput.value;
    const groups = [/[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^a-zA-Z0-9]/.test(value)].filter(Boolean).length;
    const score = value.length < 8 ? (value.length ? 1 : 0) : groups <= 1 ? 1 : groups <= 2 ? 2 : 3;
    const meter = document.querySelector('.auth-strength');
    const label = document.querySelector('#password-hint');
    meter.dataset.strength = ['empty', 'weak', 'medium', 'strong'][score];
    label.textContent = value.length < 8 ? 'Use at least 8 characters' : ['','Weak password','Fair password','Strong password'][score];
  }

  fieldRules.forEach((rule) => {
    const input = document.getElementById(rule.input);
    input.addEventListener('blur', () => showFieldError(rule, true));
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
      if (input.getAttribute('aria-invalid') === 'true') showFieldError(rule, true);
      errorBanner.hidden = true;
      if (input === passwordInput) {
        updatePasswordStrength();
        if (confirmInput.value) showFieldError(fieldRules[3], true);
      }
    });
  });

  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} ${input.id === 'register-password' ? 'password' : 'confirmation password'}`);
      button.querySelector('.material-symbols-outlined').textContent = visible ? 'visibility_off' : 'visibility';
    });
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
      await registerAccount({ fullName: form.elements.name.value, email: form.elements.email.value, password: passwordInput.value });
      form.reset();
      updatePasswordStrength();
      successBanner.hidden = false;
      window.setTimeout(() => window.location.assign('/my-courses.html'), 1200);
    } catch (error) {
      errorMessage.textContent = error.message || 'We could not create your account. Please try again.';
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
