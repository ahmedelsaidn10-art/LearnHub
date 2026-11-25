import { API_ROUTES } from './app-config.js';
import { apiRequest } from './api-client.js';

// Authentication remains server-owned; credentials are never written to browser storage.
export async function registerAccount({ fullName, email, password }) {
  const payload = await apiRequest(API_ROUTES.auth.register, {
    method: 'POST',
    body: {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    },
  });

  // Treat Vite's HTML fallback or an empty response as an unconnected API, not a success.
  if (!payload || typeof payload !== 'object') {
    throw new Error('The registration API is not connected yet.');
  }
  return payload;
}

export function verifyEmailAddress({ email, code }) {
  return apiRequest(API_ROUTES.auth.verifyEmail, {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), code: String(code).trim() },
  });
}

export function resendVerificationCode({ email }) {
  return apiRequest(API_ROUTES.auth.resendVerification, {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
  });
}

export function loginAccount({ email, password }) {
  return apiRequest(API_ROUTES.auth.login, {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
  });
}

export function logoutAccount() {
  return apiRequest(API_ROUTES.auth.logout, { method: 'POST' });
}

export function getCurrentAccount() {
  return apiRequest(API_ROUTES.auth.currentUser, { method: 'GET' })
    .then((response) => response?.data?.user ?? null);
}
