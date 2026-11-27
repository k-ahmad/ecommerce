
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Star, Heart, ImageOff } from "lucide-react";

export default function ProductCard({
  product,
  addToCart,
  isWishlisted = false,
  toggleWishlist,
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/product/${product.id}`}>
          {!imageError && product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="product-image-placeholder">
              <ImageOff size={35} />
              <span>Image unavailable</span>
            </div>
          )}

          <span className="product-badge">
            {product.badge || "FEATURED"}
          </span>
        </Link>

        <button
          type="button"
          className="product-heart"
          onClick={() => toggleWishlist?.(product.id)}
          aria-label={
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          title={
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          <Heart
            size={19}
            fill={isWishlisted ? "currentColor" : "none"}
            color={isWishlisted ? "#ef4444" : "currentColor"}
          />
        </button>
      </div>

      <div className="product-info">
        <span className="product-category">
          {product.category}
        </span>

        <h3>
          <Link to={`/product/${product.id}`} className="product-title-link">
            {product.name}
          </Link>
        </h3>

        <div className="rating">
          <Star size={15} fill="currentColor" />
          <span>{product.rating || "4.8"}</span>
        </div>

        <div className="product-bottom">
          <div className="price">
            <strong>
              Rs. {Number(product.price).toLocaleString("en-PK")}
            </strong>
          </div>

          <button
            className="add-btn"
            onClick={() => addToCart(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
