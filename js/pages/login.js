import {
  loginAccount,
  resendVerificationCode,
  verifyEmailAddress,
} from '../services/auth-service.js';
import { setButtonLoading } from '../utils/loading-state.js';

function setBusy(button, busy) {
  if (!button.classList.contains('auth-submit')) {
    setButtonLoading(button, busy, busy ? 'Sending code...' : '');
    return;
  }
  button.disabled = busy;
  button.classList.toggle('is-loading', busy);
  button.setAttribute('aria-busy', String(busy));
}

function init() {
  const form = document.querySelector('#login-form');
  if (!form) return;

  const emailInput = form.elements.email;
  const passwordInput = form.elements.password;
  const errorBanner = document.querySelector('#login-error-banner');
  const errorMessage = document.querySelector('#login-error-message');
  const successBanner = document.querySelector('#login-success-banner');
  const successMessage = document.querySelector('#login-success-message');
  const submitButton = document.querySelector('#login-submit');
  const requestCodeButton = document.querySelector('#request-verification-code');
  const verificationForm = document.querySelector('#login-verification-form');
  const verificationCode = verificationForm.elements.code;
  const verifyButton = document.querySelector('#login-verify-submit');
  const resendButton = document.querySelector('#login-resend-code');
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

  function showError(message) {
    errorMessage.textContent = message;
    errorBanner.hidden = false;
    successBanner.hidden = true;
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successBanner.hidden = false;
    errorBanner.hidden = true;
  }

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

  async function sendVerificationCode() {
    if (!emailInput.validity.valid) {
      const emailField = fields[0];
      validateField(emailField);
      emailInput.focus();
      return;
    }

    const button = verificationForm.hidden ? requestCodeButton : resendButton;
    setBusy(button, true);
    errorBanner.hidden = true;
    successBanner.hidden = true;
    try {
      const result = await resendVerificationCode({ email: emailInput.value });
      const message = result?.message || 'Check your email for the verification code.';

      if (/already verified/i.test(message)) {
        verificationForm.hidden = true;
        showSuccess(`${message} You can sign in now.`);
        return;
      }

      verificationForm.hidden = false;
      document.querySelector('#login-verification-copy').textContent = `Enter the six-digit code sent to ${emailInput.value.trim()}.`;
      verificationCode.value = '';
      showSuccess(message);
      verificationCode.focus();
    } catch (error) {
      showError(error.message || 'We could not send a verification code. Please try again.');
    } finally {
      setBusy(button, false);
    }
  }

  fields.forEach((field) => {
    field.input.addEventListener('blur', () => validateField(field));
    field.input.addEventListener('input', () => {
      if (field.input.getAttribute('aria-invalid') === 'true') validateField(field);
      errorBanner.hidden = true;
      if (field.input === emailInput) {
        verificationForm.hidden = true;
        verificationCode.value = '';
      }
    });
  });

  document.querySelector('[data-password-toggle="login-password"]').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const visible = passwordInput.type === 'password';
    passwordInput.type = visible ? 'text' : 'password';
    button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} password`);
    button.querySelector('.material-symbols-outlined').textContent = visible ? 'visibility_off' : 'visibility';
  });

  requestCodeButton.addEventListener('click', sendVerificationCode);
  resendButton.addEventListener('click', sendVerificationCode);

  verificationCode.addEventListener('input', () => {
    verificationCode.value = verificationCode.value.replace(/\D/g, '').slice(0, 6);
    document.querySelector('#login-verification-code-error').textContent = '';
    verificationCode.setAttribute('aria-invalid', 'false');
    errorBanner.hidden = true;
  });

  verificationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBanner.hidden = true;
    successBanner.hidden = true;
    const codeError = document.querySelector('#login-verification-code-error');
    const code = verificationCode.value.trim();
    if (!/^\d{6}$/.test(code)) {
      codeError.textContent = 'Enter the six-digit code from your email.';
      verificationCode.setAttribute('aria-invalid', 'true');
      verificationCode.focus();
      return;
    }

    setBusy(verifyButton, true);
    try {
      const result = await verifyEmailAddress({ email: emailInput.value, code });
      verificationForm.hidden = true;
      requestCodeButton.hidden = true;
      showSuccess(result?.message || 'Email verified. You can sign in now.');
      passwordInput.focus();
    } catch (error) {
      showError(error.message || 'We could not verify your email. Check the code and try again.');
    } finally {
      setBusy(verifyButton, false);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBanner.hidden = true;
    successBanner.hidden = true;
    if (!validateForm()) return;

    setBusy(submitButton, true);
    try {
      const result = await loginAccount({
        email: emailInput.value,
        password: passwordInput.value,
      });
      if (!result || typeof result !== 'object') {
        throw new Error('The sign-in API is not connected yet.');
      }
      passwordInput.value = '';
      showSuccess('Signed in. Taking you to My Courses…');
      const requestedPath = new URLSearchParams(window.location.search).get('next');
      const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/my-courses.html';
      window.setTimeout(() => window.location.assign(destination), 900);
    } catch (error) {
      showError(error.message || 'We could not sign you in. Check your details and try again.');
    } finally {
      setBusy(submitButton, false);
    }
  });
}

export { init };
