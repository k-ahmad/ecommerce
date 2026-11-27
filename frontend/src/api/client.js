// Backend se baat karne ka ek hi raasta.
// Backend ka address .env file mein VITE_API_URL se aata hai.

export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

const TOKEN_KEY = "token";
const USER_KEY = "demoUser"; // purana naam rakha taake pages ka code kam badle

// ---------------- SESSION (login user) ----------------

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getToken() && getCurrentUser());
}

export function isAdmin() {
  return getCurrentUser()?.role === "admin";
}

export function setSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("authChanged"));
}

export function updateStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("authChanged"));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("authChanged"));
}

// ---------------- REQUEST HELPER ----------------

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * api("/products")                       -> GET
 * api("/orders", { method: "POST", body: {...} })
 * Jawab mein backend ka poora JSON aata hai: { success, data, ... }
 */
export async function api(path, { method = "GET", body, params } = {}) {
  let url = `${API_URL}${path}`;

  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
    ).toString();
    if (query) url += `?${query}`;
  }

  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Server se connection nahi ho saka. Internet ya backend check karein.",
      0
    );
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok || !json || json.success === false) {
    // Token expire ya user block: logout kar do
    if (response.status === 401 && token) clearSession();
    if (response.status === 403 && token && /blocked/i.test(json?.error || "")) {
      clearSession();
    }

    throw new ApiError(
      json?.error || `Request failed (${response.status}).`,
      response.status
    );
  }

  return json;
}

// Chhota helper: sirf "data" wapas do
export async function apiData(path, options) {
  const json = await api(path, options);
  return json.data;
}
