import { apiData, isLoggedIn, ApiError } from "../api/client";

// Wishlist server par user ke account mein save hoti hai (login zaroori).
// ids hamesha strings hain.
let ids = [];

export function getWishlist() {
  return isLoggedIn() ? ids : [];
}

export async function loadWishlist() {
  if (!isLoggedIn()) {
    ids = [];
  } else {
    const products = await apiData("/wishlist");
    ids = products.map((p) => String(p.id));
  }
  window.dispatchEvent(new Event("wishlistUpdated"));
  return ids;
}

// Wishlist ke poore products (Wishlist page ke liye)
export async function fetchWishlistProducts() {
  if (!isLoggedIn()) return [];
  const products = await apiData("/wishlist");
  ids = products.map((p) => String(p.id));
  return products;
}

/** Add/remove. Login na ho to ApiError(status 401) throw karta hai. */
export async function toggleWishlist(productId) {
  if (!isLoggedIn()) {
    throw new ApiError("Please login to use your wishlist.", 401);
  }

  const id = String(productId);
  const { inWishlist } = await apiData(`/wishlist/${id}`, { method: "POST" });

  ids = inWishlist ? [...new Set([...ids, id])] : ids.filter((x) => x !== id);
  window.dispatchEvent(new Event("wishlistUpdated"));
  return ids;
}

// Login/logout par wishlist dobara lao
window.addEventListener("authChanged", () => {
  loadWishlist().catch(() => {});
});
