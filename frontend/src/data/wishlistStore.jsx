const WISHLIST_KEY = "wishlist";

export function getWishlist() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(WISHLIST_KEY) || "[]"
    );

    return Array.isArray(saved) ? saved.map(String) : [];
  } catch (error) {
    console.error("Wishlist loading error:", error);
    return [];
  }
}

export function saveWishlist(wishlist) {
  localStorage.setItem(
    WISHLIST_KEY,
    JSON.stringify(wishlist.map(String))
  );

  window.dispatchEvent(new Event("wishlistUpdated"));
}

export function toggleWishlist(productId) {
  const wishlist = getWishlist();
  const id = String(productId);

  const updatedWishlist = wishlist.includes(id)
    ? wishlist.filter((item) => item !== id)
    : [...wishlist, id];

  saveWishlist(updatedWishlist);

  return updatedWishlist;
}