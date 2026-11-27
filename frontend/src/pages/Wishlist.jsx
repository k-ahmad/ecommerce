import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { isLoggedIn } from "../api/client";
import { toggleWishlist } from "../data/wishlistStore";
import { useProducts, useWishlist } from "../data/hooks";
import ProductCard from "../components/ProductCard";

export default function Wishlist({ addToCart }) {
  const { products } = useProducts();
  const { wishlist, handleWishlist } = useWishlist();

  const wishlistProducts = products.filter((product) =>
    wishlist.includes(String(product.id))
  );

  async function clearWishlist() {
    try {
      for (const product of wishlistProducts) {
        await toggleWishlist(product.id);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  if (!isLoggedIn()) {
    return (
      <main className="container page section">
        <div className="wishlist-empty">
          <Heart size={55} />
          <h2>Login to see your wishlist</h2>
          <p>Your favorite products are saved in your account.</p>
          <Link to="/login" className="primary-btn">
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container page section">
      <span className="eyebrow">YOUR FAVORITES</span>

      <h1 className="section-heading">
        My Wishlist <Heart size={27} color="#ef4444" />
      </h1>

      <p className="section-subtitle">
        Your favorite products are saved here.
      </p>

      {wishlistProducts.length > 0 ? (
        <>
          <div className="wishlist-heading">
            <span>
              {wishlistProducts.length} saved product(s)
            </span>

            <button
              className="wishlist-clear-btn"
              onClick={clearWishlist}
            >
              <Trash2 size={16} />
              Clear Wishlist
            </button>
          </div>

          <div className="product-grid">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                addToCart={addToCart}
                isWishlisted={true}
                toggleWishlist={handleWishlist}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="wishlist-empty">
          <Heart size={55} />
          <h2>Your Wishlist is Empty</h2>
          <p>
            You have not saved any favorite products yet.
          </p>

          <Link to="/products" className="primary-btn">
            Explore Products
          </Link>
        </div>
      )}
    </main>
  );
}
