
import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../data/productStore";
import { getCategories } from "../data/categoryStore";
import {
  getWishlist,
  toggleWishlist as updateWishlist,
} from "../data/wishlistStore";

import ProductCard from "../components/ProductCard";

import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Package,
} from "lucide-react";

export default function Products({ addToCart }) {
  const [products, setProducts] = useState(() => getProducts());
  const [categories, setCategories] = useState(() => getCategories());

  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState(() => getWishlist());

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  useEffect(() => {
    function refreshWishlist() {
      setWishlist(getWishlist());
    }

    function refreshProducts() {
      setProducts(getProducts());
      setCategories(getCategories());
    }

    window.addEventListener("wishlistUpdated", refreshWishlist);
    window.addEventListener("productsUpdated", refreshProducts);

    return () => {
      window.removeEventListener("wishlistUpdated", refreshWishlist);
      window.removeEventListener("productsUpdated", refreshProducts);
    };
  }, []);

  function handleWishlist(productId) {
    const updated = updateWishlist(productId);
    setWishlist(updated);
  }

  const priceLimits = useMemo(() => {
    const prices = products
      .map((p) => Number(p.price))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) {
      return { min: 0, max: 100000 };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const productName = String(product.name || "").toLowerCase();
      const productCategory = String(product.category || "").toLowerCase();
      const productDescription = String(
        product.description || ""
      ).toLowerCase();

      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        productName.includes(searchValue) ||
        productCategory.includes(searchValue) ||
        productDescription.includes(searchValue);

      const matchesCategory =
        category === "All" || product.category === category;

      const price = Number(product.price) || 0;

      const matchesMin =
        minPrice === "" || price >= Number(minPrice);

      const matchesMax =
        maxPrice === "" || price <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMin &&
        matchesMax
      );
    });

    if (sort === "low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sort === "high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sort === "newest") {
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }

    return result;
  }, [products, category, search, sort, minPrice, maxPrice]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage)
  );

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * productsPerPage;

  const visibleProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [category, search, sort, minPrice, maxPrice]);

  function clearFilters() {
    setCategory("All");
    setSearch("");
    setSort("default");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  }

  const hasActiveFilters =
    category !== "All" ||
    search !== "" ||
    sort !== "default" ||
    minPrice !== "" ||
    maxPrice !== "";

  function formatPrice(price) {
    return Number(price).toLocaleString("en-PK");
  }

  return (
    <main className="container page section shop-page">

      {/* PAGE HEADER */}
      <div className="shop-page-header">
        <div>
          <span className="eyebrow">EXPLORE OUR COLLECTION</span>
          <h1 className="section-heading">Shop All Products</h1>
          <p className="shop-header-description">
            Find your favourite products from our collection.
          </p>
        </div>

        <div className="shop-header-count">
          <Package size={21} />
          <div>
            <strong>{products.length}</strong>
            <span>Total Products</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND SORT TOOLBAR */}
      <div className="shop-toolbar">

        <div className="shop-search-box">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search products, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div className="shop-sort-box">
          <ArrowUpDown size={18} />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
          >
            <option value="default">Default Sorting</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

      </div>

      {/* SHOP CONTENT */}
      <div className="shop-layout">

        {/* LEFT SIDEBAR */}
        <aside className="shop-sidebar">

          <div className="shop-sidebar-heading">
            <div>
              <SlidersHorizontal size={19} />
              <h3>Filters</h3>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="shop-clear-btn"
              >
                Clear
              </button>
            )}
          </div>

          {/* CATEGORY FILTER */}
          <div className="shop-filter-section">
            <h4>Categories</h4>

            <div className="shop-category-list">

              <button
                type="button"
                className={`shop-category-option ${
                  category === "All" ? "active" : ""
                }`}
                onClick={() => setCategory("All")}
              >
                <span>All Products</span>
                <span className="shop-category-count">
                  {products.length}
                </span>
              </button>

              {categories.map((item) => {
                const count = products.filter(
                  (p) => p.category === item.name
                ).length;

                return (
                  <button
                    type="button"
                    key={item.id || item.name}
                    className={`shop-category-option ${
                      category === item.name ? "active" : ""
                    }`}
                    onClick={() => setCategory(item.name)}
                  >
                    <span>
                      {item.icon || "📦"} {item.name}
                    </span>

                    <span className="shop-category-count">
                      {count}
                    </span>
                  </button>
                );
              })}

            </div>
          </div>

          {/* PRICE FILTER */}
          <div className="shop-filter-section shop-price-filter">
            <h4>Price Range</h4>

            <p className="shop-price-hint">
              Rs. {formatPrice(priceLimits.min)} – Rs.{" "}
              {formatPrice(priceLimits.max)}
            </p>

            <div className="shop-price-inputs">
              <div>
                <label htmlFor="shop-min-price">Minimum</label>
                <input
                  id="shop-min-price"
                  type="number"
                  min="0"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="shop-max-price">Maximum</label>
                <input
                  id="shop-max-price"
                  type="number"
                  min="0"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {minPrice !== "" &&
              maxPrice !== "" &&
              Number(minPrice) > Number(maxPrice) && (
                <p className="shop-price-error">
                  Minimum price cannot be greater than maximum price.
                </p>
              )}
          </div>

          {/* RESET FILTERS */}
          <button
            type="button"
            className="shop-reset-btn"
            onClick={clearFilters}
          >
            <RotateCcw size={16} />
            Reset All Filters
          </button>

        </aside>

        {/* RIGHT PRODUCTS AREA */}
        <section className="shop-products-area">

          {/* RESULTS HEADER */}
          <div className="shop-results-header">
            <div>
              <h2>
                {category === "All" ? "All Products" : category}
              </h2>

              <p>
                Showing{" "}
                {filteredProducts.length === 0
                  ? 0
                  : startIndex + 1}
                {" "}–{" "}
                {Math.min(
                  startIndex + productsPerPage,
                  filteredProducts.length
                )}{" "}
                of {filteredProducts.length} products
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="shop-mobile-clear"
                onClick={clearFilters}
              >
                <X size={15} />
                Clear Filters
              </button>
            )}
          </div>

          {/* PRODUCTS GRID */}
          {visibleProducts.length > 0 ? (
            <div className="product-grid shop-product-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  addToCart={addToCart}
                  isWishlisted={wishlist.some(
                    (id) => String(id) === String(product.id)
                  )}
                  toggleWishlist={handleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="shop-empty-state">
              <div className="shop-empty-icon">
                <Search size={32} />
              </div>

              <h3>No Products Found</h3>

              <p>
                We couldn't find products matching your filters.
                Try changing your search or category.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="shop-empty-reset"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* PAGINATION */}
          {filteredProducts.length > productsPerPage && (
            <div className="shop-pagination">

              <button
                type="button"
                className="shop-page-arrow"
                disabled={safePage === 1}
                onClick={() => setCurrentPage(safePage - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={19} />
                <span>Previous</span>
              </button>

              <div className="shop-page-numbers">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={
                      safePage === page ? "active" : ""
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="shop-page-arrow"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(safePage + 1)}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={19} />
              </button>

            </div>
          )}

        </section>
      </div>

    </main>
  );
}
