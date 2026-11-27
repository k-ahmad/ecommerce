// Pages ke liye chhote React hooks: products, categories aur wishlist
// backend se laate hain aur update hone par khud refresh ho jate hain.

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchProducts, getCachedProducts } from "./productStore";
import { fetchCategories } from "./categoryStore";
import { getWishlist, toggleWishlist } from "./wishlistStore";

export function useProducts() {
  const [products, setProducts] = useState(getCachedProducts);
  const [loading, setLoading] = useState(getCachedProducts().length === 0);
  const [error, setError] = useState("");

  const load = useCallback((force = false) => {
    fetchProducts({ force })
      .then((items) => {
        setProducts(items);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const refresh = () => load(true);
    window.addEventListener("productsUpdated", refresh);
    return () => window.removeEventListener("productsUpdated", refresh);
  }, [load]);

  return { products, loading, error, reload: () => load(true) };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = (force) =>
      fetchCategories({ force })
        .then((items) => alive && setCategories(items))
        .catch(() => {});

    load(false);
    const refresh = () => load(true);
    window.addEventListener("productsUpdated", refresh);
    return () => {
      alive = false;
      window.removeEventListener("productsUpdated", refresh);
    };
  }, []);

  return categories;
}

/** wishlist: product ids (strings). handleWishlist(id): add/remove. */
export function useWishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState(getWishlist);

  useEffect(() => {
    const refresh = () => setWishlist(getWishlist());
    window.addEventListener("wishlistUpdated", refresh);
    window.addEventListener("authChanged", refresh);
    return () => {
      window.removeEventListener("wishlistUpdated", refresh);
      window.removeEventListener("authChanged", refresh);
    };
  }, []);

  async function handleWishlist(productId) {
    try {
      setWishlist(await toggleWishlist(productId));
    } catch (err) {
      if (err.status === 401) {
        alert("Please login to save products in your wishlist.");
        navigate("/login");
      } else {
        alert(err.message);
      }
    }
  }

  return { wishlist, handleWishlist };
}
