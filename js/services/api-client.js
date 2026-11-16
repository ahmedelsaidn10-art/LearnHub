import { API_BASE_URL } from './app-config.js';

export class ApiError extends Error {
  constructor(message, { status = 0, payload = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function readPayload(response) {
  if (response.status === 204) return null;
  if (!response.headers.get('content-type')?.includes('application/json')) return null;
  try { return await response.json(); } catch { return null; }
}

// Shared request handling keeps API URL, credentials, JSON, and errors consistent.
export async function apiRequest(path, { body, headers = {}, ...options } = {}) {
  if (!API_BASE_URL) throw new ApiError('Set VITE_API_BASE_URL before making API requests.');

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check the API URL and your connection.');
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new ApiError(payload?.message || `The server returned an error (${response.status}).`, {
      status: response.status,
      payload,
    });
  }
  return payload;
}
