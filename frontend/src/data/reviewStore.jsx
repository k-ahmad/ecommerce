import { apiData } from "../api/client";

// Review: { id, product_id, user_id, userName, rating, comment, created_at }
export async function fetchReviews(productId) {
  return apiData(`/products/${productId}/reviews`);
}

/** Login zaroori. Ek user ek product par sirf ek review de sakta hai. */
export async function addReview(productId, { rating, comment }) {
  const review = await apiData(`/products/${productId}/reviews`, {
    method: "POST",
    body: { rating: Number(rating), comment },
  });
  // Product ki average rating badal gayi
  window.dispatchEvent(new Event("productsUpdated"));
  return review;
}

export async function deleteReview(reviewId) {
  await apiData(`/reviews/${reviewId}`, { method: "DELETE" });
  window.dispatchEvent(new Event("productsUpdated"));
}
