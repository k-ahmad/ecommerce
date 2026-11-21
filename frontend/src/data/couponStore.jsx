
const COUPON_KEY = "novaCoupons";

const defaultCoupons = [
  {
    id: 1,
    code: "NOVA10",
    type: "percentage",
    value: 10,
    minOrder: 1000,
    expiry: "2099-12-31",
    active: true,
  },
  {
    id: 2,
    code: "SAVE500",
    type: "fixed",
    value: 500,
    minOrder: 3000,
    expiry: "2099-12-31",
    active: true,
  },
];

export function getCoupons() {
  try {
    const saved = localStorage.getItem(COUPON_KEY);

    if (saved === null) {
      localStorage.setItem(
        COUPON_KEY,
        JSON.stringify(defaultCoupons)
      );

      return defaultCoupons;
    }

    const coupons = JSON.parse(saved);

    return Array.isArray(coupons) ? coupons : [];
  } catch (error) {
    console.error("Coupon loading error:", error);
    return [];
  }
}

export function saveCoupons(coupons) {
  try {
    localStorage.setItem(
      COUPON_KEY,
      JSON.stringify(coupons)
    );

    window.dispatchEvent(new Event("couponsUpdated"));
    return true;
  } catch (error) {
    console.error("Coupon saving error:", error);
    return false;
  }
}

export function validateCoupon(code, subtotal) {
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (!normalizedCode) {
    return {
      valid: false,
      error: "Please enter a coupon code.",
    };
  }

  const coupons = getCoupons();

  const coupon = coupons.find(
    (item) =>
      item.code?.toUpperCase() === normalizedCode
  );

  if (!coupon) {
    return {
      valid: false,
      error: "Invalid coupon code.",
    };
  }

  if (!coupon.active) {
    return {
      valid: false,
      error: "This coupon is currently inactive.",
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  if (coupon.expiry && coupon.expiry < today) {
    return {
      valid: false,
      error: "This coupon has expired.",
    };
  }

  if (Number(subtotal) < Number(coupon.minOrder || 0)) {
    return {
      valid: false,
      error: `Minimum order amount is Rs. ${Number(
        coupon.minOrder
      ).toLocaleString("en-PK")}.`,
    };
  }

  let discount = 0;

  if (coupon.type === "percentage") {
    discount =
      Number(subtotal) * (Number(coupon.value) / 100);
  } else {
    discount = Number(coupon.value);
  }

  discount = Math.min(
    Math.max(0, discount),
    Number(subtotal)
  );

  return {
    valid: true,
    coupon,
    discount: Math.round(discount),
  };
}
