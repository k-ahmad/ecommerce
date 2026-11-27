import { apiData, api } from "../api/client";

/*
 Stats: { totalOrders, pendingOrders, deliveredOrders, cancelledOrders,
          totalSales (sirf Delivered), totalProducts, lowStockProducts,
          totalUsers, blockedUsers, unreadMessages }
*/
export async function fetchStats() {
  return apiData("/admin/stats");
}

// User: { id, name, email, phone, address, city, role, isBlocked, createdAt }
export async function fetchUsers() {
  return apiData("/admin/users");
}

export async function toggleUserBlock(userId) {
  return apiData(`/admin/users/${userId}/block`, { method: "PUT" });
}

// Contact message: { id, name, email, phone, subject, message, read, created_at }
export async function fetchMessages() {
  return apiData("/admin/messages");
}

export async function sendContactMessage({ name, email, phone, subject, message }) {
  const json = await api("/contact", {
    method: "POST",
    body: { name, email, phone, subject, message },
  });
  return json.message;
}
