
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { getProducts } from "../data/productStore";
import {
  getWishlist,
  toggleWishlist,
} from "../data/wishlistStore";
import ProductCard from "../components/ProductCard";

export default function Wishlist({ addToCart }) {
  const [wishlist, setWishlist] = useState(getWishlist);
  const [products, setProducts] = useState(getProducts);

  useEffect(() => {
    function refreshWishlist() {
      setWishlist(getWishlist());
      setProducts(getProducts());
    }

    window.addEventListener("wishlistUpdated", refreshWishlist);
    window.addEventListener("productsUpdated", refreshWishlist);

    return () => {
      window.removeEventListener(
        "wishlistUpdated",
        refreshWishlist
      );
      window.removeEventListener(
        "productsUpdated",
        refreshWishlist
      );
    };
  }, []);

  const wishlistProducts = products.filter((product) =>
    wishlist.includes(String(product.id))
  );

  function removeProduct(productId) {
    const updated = toggleWishlist(productId);
    setWishlist(updated);
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
              onClick={() => {
                wishlistProducts.forEach((product) => {
                  toggleWishlist(product.id);
                });
                setWishlist(getWishlist());
              }}
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
                toggleWishlist={removeProduct}
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
