
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { addReview, fetchReviews } from "../data/reviewStore";
import { useProducts, useWishlist } from "../data/hooks";
import { getCurrentUser, isLoggedIn } from "../api/client";
import { formatOrderDate } from "../data/orderStore";

import ProductCard from "../components/ProductCard";

import {
  Star,
  MessageSquare,
  Heart,
  ShoppingBag,
  ChevronRight,
  Package,
} from "lucide-react";

export default function ProductDetails({ addToCart }) {
  const { id } = useParams();

  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { wishlist, handleWishlist } = useWishlist();

  const product = products.find(
    (p) => String(p.id) === String(id)
  );

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loggedIn = isLoggedIn();
  const reviewName = loggedIn ? getCurrentUser()?.name || "" : "";

  // Reviews server se lao
  useEffect(() => {
    let alive = true;
    fetchReviews(id)
      .then((items) => alive && setReviews(items))
      .catch(() => alive && setReviews([]));
    return () => {
      alive = false;
    };
  }, [id]);

  if (!product && loading) {
    return (
      <main className="container section">
        <div className="pd-not-found">
          <h2>Loading product...</h2>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container section">
        <div className="pd-not-found">
          <h2>Product Not Found</h2>
          <Link to="/products" className="pd-back-link">
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) => total + Number(review.rating),
            0
          ) / reviews.length
        ).toFixed(1)
      : Number(product.rating) || 0;

  const isWishlisted = wishlist.some(
    (item) => String(item) === String(product.id)
  );

  async function handleReviewSubmit(e) {
    e.preventDefault();

    if (!loggedIn) {
      alert("Please login to write a review.");
      navigate("/login");
      return;
    }

    if (!reviewText.trim()) {
      alert("Please write your review.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await addReview(product.id, {
        rating: Number(rating),
        comment: reviewText.trim(),
      });
      setReviews((current) => [saved, ...current]);
      setRating(5);
      setReviewText("");
      alert("Your review has been submitted!");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const relatedProducts = products
    .filter(
      (item) =>
        String(item.id) !== String(product.id) &&
        item.category?.toLowerCase() ===
          product.category?.toLowerCase()
    )
    .slice(0, 5);

  return (
    <main className="container section pd-page">

      {/* BREADCRUMB */}
      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={15} />
        <Link to="/products">Shop</Link>
        <ChevronRight size={15} />
        <span>{product.category}</span>
        <ChevronRight size={15} />
        <strong>{product.name}</strong>
      </div>

      {/* MAIN PRODUCT AREA */}
      <section className="pd-main-layout">

        {/* LEFT IMAGE AND DESCRIPTION */}
        <div className="pd-left-column">

          <div className="pd-image-box">
            <img
              src={product.image}
              alt={product.name}
            />

            {product.badge && (
              <span className="pd-image-badge">
                {product.badge}
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="pd-description-box">
            <div className="pd-description-heading">
              <span className="pd-small-label">
                PRODUCT INFORMATION
              </span>
              <h2>Description</h2>
            </div>

            <p>
              {product.description ||
                "Discover the quality and style of this product. Designed for comfort and everyday use."}
            </p>

            <div className="pd-feature-row">
              <div className="pd-feature-item">
                <Package size={19} />
                <span>Quality Product</span>
              </div>

              <div className="pd-feature-item">
                <ShoppingBag size={19} />
                <span>Easy Shopping</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PRODUCT INFORMATION */}
        <div className="pd-info-card">

          <div className="pd-info-top">
            <span className="pd-category-label">
              {product.category}
            </span>

            <button
              type="button"
              className={`pd-wishlist-btn ${
                isWishlisted ? "active" : ""
              }`}
              onClick={() => handleWishlist(product.id)}
              title={
                isWishlisted
                  ? "Remove from Wishlist"
                  : "Add to Wishlist"
              }
            >
              <Heart
                size={21}
                fill={isWishlisted ? "currentColor" : "none"}
              />
            </button>
          </div>

          <h1>{product.name}</h1>

          {/* RATING */}
          <div className="pd-rating-row">
            <div className="pd-stars">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  size={17}
                  fill={
                    index < Math.round(Number(averageRating))
                      ? "currentColor"
                      : "none"
                  }
                />
              ))}
            </div>

            <strong>{averageRating}</strong>

            <span>
              ({reviews.length} Reviews)
            </span>
          </div>

          {/* PRICE */}
          <div className="pd-price-area">
            <strong>
              Rs. {Number(product.price).toLocaleString("en-PK")}
            </strong>

            {product.oldPrice > product.price && (
              <del>
                Rs. {Number(product.oldPrice).toLocaleString("en-PK")}
              </del>
            )}
          </div>

          <div className="pd-divider" />

          {/* PRODUCT DETAILS */}
          <div className="pd-specifications">
            <div>
              <span>Category:</span>
              <strong>{product.category}</strong>
            </div>

            <div>
              <span>Product:</span>
              <strong>{product.name}</strong>
            </div>

            <div>
              <span>Availability:</span>
              <strong
                className={
                  Number(product.stock) > 0
                    ? "pd-in-stock"
                    : "pd-out-stock"
                }
              >
                {Number(product.stock) > 0
                  ? "In Stock"
                  : "Out of Stock"}
              </strong>
            </div>

            <div>
              <span>Available Quantity:</span>
              <strong>{product.stock}</strong>
            </div>
          </div>

          <div className="pd-divider" />

          {/* SHORT DESCRIPTION */}
          <p className="pd-short-description">
            {product.description}
          </p>

          {/* ADD TO CART */}
          <button
            type="button"
            className="pd-add-cart"
            disabled={Number(product.stock) <= 0}
            onClick={() => addToCart(product)}
          >
            <ShoppingBag size={20} />

            {Number(product.stock) <= 0
              ? "Out of Stock"
              : "Add To Cart"}
          </button>

          <div className="pd-delivery-note">
            <Package size={18} />
            <span>Available for purchase while stock lasts</span>
          </div>

        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="pd-reviews-section">

        <div className="pd-section-heading">
          <span className="pd-small-label">
            CUSTOMER FEEDBACK
          </span>

          <h2>Reviews & Ratings</h2>

          <p>
            See what customers think about this product.
          </p>
        </div>

        <div className="pd-reviews-layout">

          {/* REVIEW FORM */}
          <form
            className="pd-review-form"
            onSubmit={handleReviewSubmit}
          >
            <h3>Write Your Review</h3>

            {loggedIn ? (
              <p>
                Reviewing as <strong>{reviewName}</strong>
              </p>
            ) : (
              <p>
                <Link to="/login">Login</Link> to write a review.
              </p>
            )}

            <label>Your Rating</label>

            <div className="pd-review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    size={25}
                    fill={star <= rating ? "#facc15" : "none"}
                    color="#facc15"
                  />
                </button>
              ))}
            </div>

            <label>Your Review</label>

            <textarea
              rows="4"
              placeholder="Write your experience with this product..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <button
              type="submit"
              className="pd-submit-review"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>

          {/* CUSTOMER REVIEWS */}
          <div className="pd-review-list">
            <h3>
              Customer Reviews ({reviews.length})
            </h3>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div className="pd-review-card" key={review.id}>
                  <div className="pd-review-card-top">
                    <div>
                      <strong>{review.userName}</strong>
                      <small>{formatOrderDate(review.created_at)}</small>
                    </div>

                    <div className="pd-review-card-stars">
                      {Array.from(
                        { length: Number(review.rating) },
                        (_, index) => (
                          <Star
                            key={index}
                            size={15}
                            fill="#facc15"
                            color="#facc15"
                          />
                        )
                      )}
                    </div>
                  </div>

                  <p>{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="pd-no-reviews">
                <MessageSquare size={35} />
                <p>
                  No reviews yet. Be the first to review this product!
                </p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* SIMILAR PRODUCTS */}
      <section className="pd-similar-section">

        <div className="pd-section-heading">
          <span className="pd-small-label">
            YOU MAY ALSO LIKE
          </span>

          <h2>Similar Products</h2>

          <p>
            More products from the {product.category} category.
          </p>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="pd-similar-grid">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                addToCart={addToCart}
                isWishlisted={wishlist.some(
                  (wishId) => String(wishId) === String(item.id)
                )}
                toggleWishlist={handleWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="pd-related-empty">
            <p>
              No other products available in this category yet.
            </p>

            <Link to="/products" className="pd-submit-review">
              Browse All Products
            </Link>
          </div>
        )}

      </section>

    </main>
  );
}
