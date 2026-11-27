import { apiData } from "../api/client";
import { invalidateProducts } from "./productStore";

/*
 Order (server se):
 {
   id, status: "Pending"|"Shipped"|"Delivered"|"Cancelled",
   customer: { name, phone, city, address, email },
   items: [{ productId, name, image, category, price, quantity, lineTotal }],
   subtotal, discount, deliveryFee, total,
   coupon: { code, type, value } | null,
   paymentMethod, email, created_at, updated_at
 }
*/

/** cart: [{ id, quantity }]. Qeemat server khud database se lagata hai. */
export async function placeOrder({ customer, cart, couponCode }) {
  const order = await apiData("/orders", {
    method: "POST",
    body: {
      customer,
      items: cart.map((item) => ({ productId: String(item.id), quantity: item.quantity })),
      couponCode: couponCode || undefined,
    },
  });
  invalidateProducts();
  window.dispatchEvent(new Event("ordersUpdated"));
  return order;
}

export async function fetchMyOrders() {
  return apiData("/orders/my");
}

export async function cancelOrder(orderId) {
  const order = await apiData(`/orders/${orderId}/cancel`, { method: "POST" });
  invalidateProducts();
  window.dispatchEvent(new Event("ordersUpdated"));
  return order;
}

// ---------- ADMIN ----------

export async function fetchAllOrders(status) {
  return apiData("/admin/orders", { params: { status } });
}

export async function updateOrderStatus(orderId, status) {
  const order = await apiData(`/admin/orders/${orderId}/status`, {
    method: "PUT",
    body: { status },
  });
  if (status === "Cancelled") invalidateProducts();
  window.dispatchEvent(new Event("ordersUpdated"));
  return order;
}

// Backend .env ki FREE_DELIVERY_ABOVE aur DELIVERY_FEE jaisi values rakhein
export const FREE_DELIVERY_ABOVE = Number(import.meta.env.VITE_FREE_DELIVERY_ABOVE || 5000);
export const DELIVERY_FEE = Number(import.meta.env.VITE_DELIVERY_FEE || 250);

export function deliveryFeeFor(subtotal) {
  return subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
}

export const ORDER_STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"];

// "2026-11-26T08:02:23+00:00" -> "26 Nov 2026"
export function formatOrderDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}
