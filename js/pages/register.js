import {
  registerAccount,
  resendVerificationCode,
  verifyEmailAddress,
} from '../services/auth-service.js';
import { setButtonLoading } from '../utils/loading-state.js';

const fieldRules = [
  { input: 'register-name', error: 'name-error', validate: (value) => value.trim().length >= 2 ? '' : 'Enter your full name (at least 2 characters).' },
  { input: 'register-email', error: 'email-error', validate: (_value, input) => input.validity.valid ? '' : 'Enter a valid email address.' },
  { input: 'register-password', error: 'password-error', validate: (value) => value.length >= 8 ? '' : 'Use at least 8 characters.' },
  { input: 'register-confirm-password', error: 'confirm-password-error', validate: (value, _input, form) => value && value === form.elements.password.value ? '' : 'Passwords do not match.' },
  { input: 'register-terms', error: 'terms-error', validate: (_value, input) => input.checked ? '' : 'Please accept the terms to continue.' },
];

function setBusy(button, busy) {
  button.disabled = busy;
  button.classList.toggle('is-loading', busy);
  button.setAttribute('aria-busy', String(busy));
}

function init() {
  const registrationForm = document.querySelector('#registration-form');
  const verificationForm = document.querySelector('#verification-form');
  if (!registrationForm || !verificationForm) return;

  const verificationSection = document.querySelector('#email-verification');
  const verifiedSection = document.querySelector('#email-verified');
  const submitButton = document.querySelector('#register-submit');
  const verifyButton = document.querySelector('#verify-submit');
  const resendButton = document.querySelector('#resend-code');
  const errorBanner = document.querySelector('#register-error-banner');
  const errorMessage = document.querySelector('#register-error-message');
  const successBanner = document.querySelector('#register-success-banner');
  const successMessage = document.querySelector('#register-success-message');
  const passwordInput = registrationForm.elements.password;
  const confirmInput = registrationForm.elements.confirmPassword;
  const verificationCode = verificationForm.elements.code;
  let verificationEmail = '';

  function showError(message) {
    errorMessage.textContent = message;
    errorBanner.hidden = false;
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successBanner.hidden = false;
  }

  function clearNotices() {
    errorBanner.hidden = true;
    successBanner.hidden = true;
  }

  function showFieldError(rule, show) {
    const input = document.getElementById(rule.input);
    const error = document.getElementById(rule.error);
    const value = input.type === 'checkbox' ? input.checked : input.value;
    const message = show ? rule.validate(value, input, registrationForm) : '';
    error.textContent = message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }

  function validateRegistration() {
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
    label.textContent = value.length < 8 ? 'Use at least 8 characters' : ['', 'Weak password', 'Fair password', 'Strong password'][score];
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

  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotices();
    if (!validateRegistration()) return;

    setBusy(submitButton, true);
    try {
      verificationEmail = registrationForm.elements.email.value.trim().toLowerCase();
      await registerAccount({
        fullName: registrationForm.elements.name.value,
        email: verificationEmail,
        password: passwordInput.value,
      });

      registrationForm.reset();
      updatePasswordStrength();
      registrationForm.hidden = true;
      verificationSection.hidden = false;
      document.querySelector('#register-kicker').textContent = 'EMAIL VERIFICATION';
      document.querySelector('#register-title').textContent = 'Verify your email';
      document.querySelector('#register-description').textContent = 'One quick step to activate your LearnHub account.';
      document.querySelector('#verification-email').textContent = verificationEmail;
      document.querySelector('#register-switch').hidden = true;
      showSuccess('Account created. Check your email for the verification code.');
      verificationCode.focus();
    } catch (error) {
      showError(error.message || 'We could not create your account. Please try again.');
    } finally {
      setBusy(submitButton, false);
    }
  });

  verificationCode.addEventListener('input', () => {
    verificationCode.value = verificationCode.value.replace(/\D/g, '').slice(0, 6);
    document.querySelector('#verification-code-error').textContent = '';
    verificationCode.setAttribute('aria-invalid', 'false');
    errorBanner.hidden = true;
  });

  verificationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotices();
    const code = verificationCode.value.trim();
    const codeError = document.querySelector('#verification-code-error');
    if (!/^\d{6}$/.test(code)) {
      codeError.textContent = 'Enter the six-digit code from your email.';
      verificationCode.setAttribute('aria-invalid', 'true');
      verificationCode.focus();
      return;
    }

    setBusy(verifyButton, true);
    try {
      await verifyEmailAddress({ email: verificationEmail, code });
      verificationSection.hidden = true;
      verifiedSection.hidden = false;
      document.querySelector('#register-kicker').textContent = 'EMAIL VERIFIED';
      document.querySelector('#register-title').textContent = 'Your account is ready';
      document.querySelector('#register-description').textContent = 'Your email has been confirmed. Sign in to continue.';
      showSuccess('Email verified successfully. You can now sign in.');
      document.querySelector('.auth-legal').hidden = true;
      verifiedSection.querySelector('a').focus();
    } catch (error) {
      showError(error.message || 'We could not verify your email. Check the code and try again.');
    } finally {
      setBusy(verifyButton, false);
    }
  });

  resendButton.addEventListener('click', async () => {
    clearNotices();
    setButtonLoading(resendButton, true, 'Sending code...');
    try {
      await resendVerificationCode({ email: verificationEmail });
      verificationCode.value = '';
      showSuccess('A new verification code has been sent to your email.');
      verificationCode.focus();
    } catch (error) {
      showError(error.message || 'We could not send a new code. Please try again.');
    } finally {
      setButtonLoading(resendButton, false);
    }
  });
}

export { init };
