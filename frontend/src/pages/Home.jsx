
import { getProducts } from "../data/productStore";
import { getCategories } from "../data/categoryStore";
import {
  getWishlist,
  toggleWishlist as updateWishlist,
} from "../data/wishlistStore";

import "../App.css";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import {
  ShoppingBag,
  ArrowRight,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  Headphones,
  Sparkles,
  Target,
  Award,
  Users,
} from "lucide-react";

function Home({ addToCart }) {
  const [search, setSearch] = useState("");
  const [products] = useState(getProducts);
  const [categories] = useState(getCategories);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // WISHLIST STATE
  const [wishlist, setWishlist] = useState(getWishlist);

  // LISTEN FOR WISHLIST CHANGES
  useEffect(() => {
    function refreshWishlist() {
      setWishlist(getWishlist());
    }

    window.addEventListener("wishlistUpdated", refreshWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", refreshWishlist);
    };
  }, []);

  // ADD OR REMOVE PRODUCT FROM WISHLIST
  function handleWishlist(productId) {
    const updated = updateWishlist(productId);
    setWishlist(updated);
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app">
      {/* ANNOUNCEMENT BAR */}
      <div className="announcement">
        <Sparkles size={14} />
        Free delivery on orders above Rs. 5,000
      </div>

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="container hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="eyebrow">
              <Sparkles size={15} /> THE FUTURE OF SHOPPING
            </span>

            <h1>
              Discover Your
              <br />
              <span>Perfect Style.</span>
            </h1>

            <p>
              Explore a curated collection of premium products. Quality, style
              and convenience — all in one place.
            </p>

            <div className="hero-buttons">
              <a href="#products" className="primary-btn">
                Shop Collection <ArrowRight size={18} />
              </a>

              <a href="#categories" className="secondary-btn">
                Explore Categories
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>10K+</strong>
                <small>Happy Customers</small>
              </div>

              <div>
                <strong>500+</strong>
                <small>Premium Products</small>
              </div>

              <div>
                <strong>4.9/5</strong>
                <small>Customer Rating</small>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
          >
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1100"
              alt="Premium shopping collection"
            />

            <div className="floating-card">
              <span>✦</span>
              <div>
                <strong>Premium Collection</strong>
                <small>Discover something special</small>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="container feature-grid">
          <div className="feature-item">
            <Truck />
            <div>
              <strong>Free Shipping</strong>
              <small>On selected orders</small>
            </div>
          </div>

          <div className="feature-item">
            <ShieldCheck />
            <div>
              <strong>Secure Payments</strong>
              <small>Safe shopping experience</small>
            </div>
          </div>

          <div className="feature-item">
            <Headphones />
            <div>
              <strong>24/7 Support</strong>
              <small>Here when you need us</small>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-top">
            <div>
              <span className="eyebrow">EXPLORE OUR STORE</span>
              <h2 className="section-heading">Shop by Category</h2>
              <p className="section-subtitle">
                Find exactly what you are looking for.
              </p>
            </div>

            <a
              href="#products"
              className="text-link"
              onClick={() => setSelectedCategory("All")}
            >
              View all <ArrowRight size={17} />
            </a>
          </div>

          <div className="category-grid">
            {categories.map((category, index) => (
              <motion.a
                href="#products"
                className="category-card"
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="category-icon">
                  {category.icon || "📦"}
                </span>

                <h3>{category.name}</h3>

                <span className="category-arrow">
                  <ArrowRight size={18} />
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="section products-section" id="products">
        <div className="container">
          <div className="section-top">
            <div>
              <span className="eyebrow">HANDPICKED FOR YOU</span>

              <h2 className="section-heading">
                {selectedCategory === "All"
                  ? "Featured Products"
                  : selectedCategory}
              </h2>

              <p className="section-subtitle">
                Discover our most loved products.
              </p>
            </div>

            {selectedCategory !== "All" && (
              <button
                className="text-link"
                onClick={() => setSelectedCategory("All")}
              >
                All Products <ArrowRight size={17} />
              </button>
            )}
          </div>

          <div className="product-grid">
            {filteredProducts.map((product, index) => {
              const isWishlisted = wishlist.includes(String(product.id));

              return (
                <motion.article
                  className="product-card"
                  key={product.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="product-image">
                    {/* PRODUCT IMAGE CLICK */}
                    <Link
                      to={`/product/${product.id}`}
                      className="home-product-link"
                      aria-label={`View ${product.name} details`}
                    >
                      <img src={product.image} alt={product.name} />
                    </Link>

                    {product.badge && (
                      <span className="product-badge">
                        {product.badge}
                      </span>
                    )}

                    {/* WISHLIST BUTTON */}
                    <button
                      type="button"
                      className="product-heart"
                      onClick={() => handleWishlist(product.id)}
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
                        size={18}
                        fill={isWishlisted ? "currentColor" : "none"}
                        color={isWishlisted ? "#ef4444" : "currentColor"}
                      />
                    </button>
                  </div>

                  <div className="product-info">
                    <span className="product-category">
                      {product.category}
                    </span>

                    {/* PRODUCT NAME CLICK */}
                    <h3>
                      <Link
                        to={`/product/${product.id}`}
                        className="home-product-name-link"
                      >
                        {product.name}
                      </Link>
                    </h3>

                    <div className="rating">
                      <Star size={15} fill="currentColor" />
                      <span>{product.rating || 0}</span>
                    </div>

                    <div className="product-bottom">
                      <div className="price">
                        <strong>
                          Rs. {Number(product.price).toLocaleString("en-PK")}
                        </strong>

                        {product.oldPrice > 0 && (
                          <del>
                            Rs.{" "}
                            {Number(product.oldPrice).toLocaleString("en-PK")}
                          </del>
                        )}
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
                </motion.article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <p className="empty-search">
              No products found in this category.
            </p>
          )}
        </div>
      </section>

      {/* ABOUT NOVA STORE */}
      <section className="home-about-section">
        <div className="container home-about-container">
          <motion.div
            className="home-about-content"
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow">GET TO KNOW US</span>

            <h2>
              Welcome to
              <br />
              <span>NOVA STORE.</span>
            </h2>

            <p>
              We believe shopping should be simple, enjoyable and accessible.
              NovaStore brings together quality products, modern style and
              convenience in one place.
            </p>

            <p>
              From electronics to fashion and accessories, we want to make
              discovering your favorite products a better experience.
            </p>

            <Link to="/about" className="primary-btn">
              Read Our Story <ArrowRight size={18} />
            </Link>
          </motion.div>

          <motion.div
            className="home-about-cards"
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="home-about-card">
              <div className="about-icon">
                <Target size={27} />
              </div>
              <h3>Our Mission</h3>
              <p>
                Making online shopping easy and convenient for everyone.
              </p>
            </div>

            <div className="home-about-card">
              <div className="about-icon">
                <Award size={27} />
              </div>
              <h3>Our Promise</h3>
              <p>
                Quality, convenience and a better shopping experience.
              </p>
            </div>

            <div className="home-about-card">
              <div className="about-icon">
                <Users size={27} />
              </div>
              <h3>Customer First</h3>
              <p>
                Your satisfaction and trust always matter to us.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section">
        <div className="container cta-content">
          <div>
            <span className="eyebrow">WHY NOVASTORE?</span>

            <h2>Shopping Made Simple. Style Made Yours.</h2>

            <p>
              We bring together quality products and a smooth shopping
              experience to make every purchase special.
            </p>
          </div>

          <a href="#products" className="primary-btn">
            Start Shopping <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}

export default Home;
