import { apiData, api, setSession, clearSession, updateStoredUser } from "../api/client";

export async function login(email, password) {
  const data = await apiData("/auth/login", {
    method: "POST",
    body: { email: email.trim().toLowerCase(), password },
  });
  setSession(data.token, data.user);
  return data.user;
}

export async function register({ name, email, phone, password }) {
  const data = await apiData("/auth/register", {
    method: "POST",
    body: { name: name.trim(), email: email.trim().toLowerCase(), phone, password },
  });
  setSession(data.token, data.user);
  return data.user;
}

export function logout() {
  clearSession();
}

// Server se taaza user data (blocked ho to error aayega aur logout ho jayega)
export async function refreshMe() {
  const user = await apiData("/auth/me");
  updateStoredUser(user);
  return user;
}

export async function updateProfile(fields) {
  const user = await apiData("/auth/me", { method: "PUT", body: fields });
  updateStoredUser(user);
  return user;
}

export async function changePassword(currentPassword, newPassword) {
  const json = await api("/auth/change-password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
  return json.message;
}

export async function forgotPassword(email) {
  const json = await api("/auth/forgot-password", {
    method: "POST",
    body: { email: email.trim().toLowerCase() },
  });
  return json.message;
}

export async function resetPassword(email, code, newPassword) {
  const json = await api("/auth/reset-password", {
    method: "POST",
    body: { email: email.trim().toLowerCase(), code: code.trim(), newPassword },
  });
  return json.message;
}
