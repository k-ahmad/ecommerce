
const REVIEW_KEY = "productReviews";

export function getReviews(productId) {
  try {
    const reviews = JSON.parse(
      localStorage.getItem(REVIEW_KEY) || "[]"
    );

    if (!Array.isArray(reviews)) return [];

    return reviews.filter(
      (review) => String(review.productId) === String(productId)
    );
  } catch (error) {
    console.error("Reviews loading error:", error);
    return [];
  }
}

export function saveReview(review) {
  try {
    const reviews = JSON.parse(
      localStorage.getItem(REVIEW_KEY) || "[]"
    );

    const updatedReviews = [
      ...reviews,
      {
        ...review,
        id: Date.now(),
      },
    ];

    localStorage.setItem(
      REVIEW_KEY,
      JSON.stringify(updatedReviews)
    );

    window.dispatchEvent(new Event("reviewsUpdated"));

    return true;
  } catch (error) {
    console.error("Review saving error:", error);
    return false;
  }
}
