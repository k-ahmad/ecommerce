import { apiData } from "../api/client";

/**
 * Coupon server par check hota hai.
 * Wapas: { valid: true, coupon: {code,type,value}, discount }  ya  { valid: false, error }
 */
export async function validateCoupon(code, subtotal) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return { valid: false, error: "Please enter a coupon code." };

  try {
    const data = await apiData("/coupons/validate", {
      method: "POST",
      body: { code: normalized, subtotal: Number(subtotal) || 0 },
    });
    return {
      valid: true,
      coupon: { code: data.code, type: data.type, value: data.value },
      discount: data.discount,
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// ---------- ADMIN ----------
// Coupon: { id, code, type: "percentage"|"fixed", value, minOrder, expiry: "YYYY-MM-DD"|null, active }

export async function fetchCoupons() {
  return apiData("/coupons");
}

export async function createCoupon(coupon) {
  return apiData("/coupons", { method: "POST", body: coupon });
}

export async function updateCoupon(id, fields) {
  return apiData(`/coupons/${id}`, { method: "PUT", body: fields });
}

export async function deleteCoupon(id) {
  return apiData(`/coupons/${id}`, { method: "DELETE" });
}
