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
  let response;
  try {
    const method = (options.method || 'GET').toUpperCase();
    const csrfToken = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
      ? ''
      : document.cookie.split('; ').find((cookie) => cookie.startsWith('csrf_access_token='))?.split('=').slice(1).join('=') || '';
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(csrfToken ? { 'X-CSRF-TOKEN': decodeURIComponent(csrfToken) } : {}),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check the API URL and your connection.');
  }

  const payload = await readPayload(response);
  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || payload?.msg || `The server returned an error (${response.status}).`, {
      status: response.status,
      payload,
    });
  }
  return payload;
}

export async function getAllPaginatedItems(path) {
  const firstPage = await apiRequest(`${path}?page=1`, { method: 'GET' });
  const firstData = firstPage?.data;
  if (!Array.isArray(firstData?.items)) return [];

  const totalPages = Math.max(1, Number(firstData.pagination?.totalPages) || 1);
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      apiRequest(`${path}?page=${index + 2}`, { method: 'GET' })),
  );

  return [firstData, ...remainingPages.map((response) => response?.data)]
    .flatMap((page) => Array.isArray(page?.items) ? page.items : []);
}
