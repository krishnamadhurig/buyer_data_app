const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken = null;
let onSessionEnd = () => {};
let refreshPromise = null;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.fields = data?.errors || data?.fields || {};
  }
}

export function setAccessToken(token) {
  accessToken = token;
}

export function setSessionEndHandler(fn) {
  onSessionEnd = fn;
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new ApiError(data?.message || 'Refresh failed', res.status, data);
        accessToken = data.accessToken;
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const isForm = body instanceof FormData;
  const headers = {};
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    try {
      await refreshAccessToken();
    } catch (err) {
      if (err.status === 401) {
        onSessionEnd();
        throw new ApiError('Your session has ended. Please sign in again.', 401);
      }
      throw err;
    }
    return request(path, { method, body, auth, retry: false });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message || 'Request failed', res.status, data);
  return data;
}

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: async (identifier, password) => {
    const data = await request('/auth/login', { method: 'POST', body: { identifier, password }, auth: false });
    accessToken = data.accessToken;
    return data;
  },
  logout: () => request('/auth/logout', { method: 'POST', auth: false }),
  me: () => request('/auth/me'),
  restore: () => refreshAccessToken(),
};

export const buyersApi = {
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/buyers/upload', { method: 'POST', body: form });
  },
  list: ({ search = '', page = 1, limit = 10 } = {}) => {
    const qs = new URLSearchParams({ page, limit });
    if (search) qs.set('search', search);
    return request(`/buyers?${qs}`);
  },
};