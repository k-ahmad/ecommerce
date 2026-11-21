import SalesReports from "../components/SalesReports";
import CouponManagement from "../components/CouponManagement";
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  UserCheck,
  UserX,
  Search,
  AlertTriangle,
} from "lucide-react";

import {
  getProducts,
  saveProducts as storeProducts,
} from "../data/productStore";

import {
  getCategories,
  saveCategories as storeCategories,
} from "../data/categoryStore";

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("All");
  const [customerSearch, setCustomerSearch] = useState("");

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "📦",
  });

  const emptyProduct = {
    name: "",
    category: "",
    price: "",
    oldPrice: "",
    stock: "",
    image: "",
    description: "",
    rating: 5,
    badge: "",
  };

  const [form, setForm] = useState(emptyProduct);

  // -----------------------------
  // LOAD DATA
  // -----------------------------

  function loadOrders() {
    try {
      const saved = JSON.parse(
        localStorage.getItem("orders") || "[]"
      );

      setOrders(Array.isArray(saved) ? saved : []);
    } catch (error) {
      console.error("Orders loading error:", error);
      setOrders([]);
    }
  }

  function loadProducts() {
    setProducts(getProducts());
  }

  function loadCategories() {
    setCategories(getCategories());
  }

  function loadCustomers() {
    try {
      const saved = JSON.parse(
        localStorage.getItem("users") || "[]"
      );

      setCustomers(Array.isArray(saved) ? saved : []);
    } catch (error) {
      console.error("Users loading error:", error);
      setCustomers([]);
    }
  }

  function refreshDashboard() {
    loadOrders();
    loadProducts();
    loadCategories();
    loadCustomers();
  }

  useEffect(() => {
    refreshDashboard();

    const handleOrdersUpdate = () => loadOrders();
    const handleProductsUpdate = () => loadProducts();
    const handleUsersUpdate = () => loadCustomers();

    window.addEventListener("ordersUpdated", handleOrdersUpdate);
    window.addEventListener("productsUpdated", handleProductsUpdate);
    window.addEventListener("usersUpdated", handleUsersUpdate);

    return () => {
      window.removeEventListener("ordersUpdated", handleOrdersUpdate);
      window.removeEventListener("productsUpdated", handleProductsUpdate);
      window.removeEventListener("usersUpdated", handleUsersUpdate);
    };
  }, []);

  // -----------------------------
  // SAVE PRODUCTS
  // -----------------------------

  function saveProductList(updatedProducts) {
    const saved = storeProducts(updatedProducts);

    if (!saved) {
      alert("Unable to save products. Please try again.");
      return false;
    }

    setProducts(updatedProducts);
    window.dispatchEvent(new Event("productsUpdated"));

    return true;
  }

  // -----------------------------
  // PRODUCT MANAGEMENT
  // -----------------------------

  function handleSubmit(e) {
    e.preventDefault();

    const name = form.name.trim();
    const price = Number(form.price);
    const oldPrice = Number(form.oldPrice || 0);
    const stock = Number(form.stock);
    const rating = Number(form.rating || 5);

    if (!name || !form.category || !form.image.trim()) {
      alert("Please complete all required product fields.");
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(oldPrice) ||
      oldPrice < 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 5
    ) {
      alert("Please enter valid price, stock and rating values.");
      return;
    }

    const duplicate = products.some(
      (product) =>
        product.name.trim().toLowerCase() === name.toLowerCase() &&
        String(product.id) !== String(editingId)
    );

    if (duplicate) {
      alert("A product with this name already exists.");
      return;
    }

    const productData = {
      ...form,
      id: editingId !== null ? editingId : Date.now(),
      name,
      category: form.category,
      price,
      oldPrice,
      stock,
      rating,
      badge: form.badge.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
    };

    let updated;

    if (editingId !== null) {
      updated = products.map((product) =>
        String(product.id) === String(editingId)
          ? productData
          : product
      );
    } else {
      updated = [...products, productData];
    }

    if (saveProductList(updated)) {
      setForm(emptyProduct);
      setEditingId(null);
      setShowForm(false);
      alert(editingId !== null ? "Product updated!" : "Product added!");
    }
  }

  function editProduct(product) {
    setForm({
      ...emptyProduct,
      ...product,
      price: String(product.price ?? ""),
      oldPrice: String(product.oldPrice ?? ""),
      stock: String(product.stock ?? ""),
      rating: String(product.rating ?? 5),
    });

    setEditingId(product.id);
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteProduct(id) {
    const product = products.find(
      (item) => String(item.id) === String(id)
    );

    if (
      !window.confirm(
        `Are you sure you want to delete "${product?.name}"?`
      )
    ) {
      return;
    }

    const updated = products.filter(
      (item) => String(item.id) !== String(id)
    );

    if (saveProductList(updated)) {
      alert("Product deleted successfully.");
    }
  }

  function cancelProductForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyProduct);
  }

  // -----------------------------
  // CATEGORY MANAGEMENT
  // -----------------------------

  function handleCategorySubmit(e) {
    e.preventDefault();

    const name = categoryForm.name.trim();

    if (!name) {
      alert("Please enter a category name.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        String(category.id) !== String(editingCategoryId)
    );

    if (duplicate) {
      alert("This category already exists.");
      return;
    }

    const oldCategory = categories.find(
      (category) =>
        String(category.id) === String(editingCategoryId)
    );

    let updatedCategories;

    if (editingCategoryId !== null) {
      updatedCategories = categories.map((category) =>
        String(category.id) === String(editingCategoryId)
          ? {
              ...category,
              name,
              icon: categoryForm.icon.trim() || "📦",
            }
          : category
      );

      // Category rename hone par products bhi update karo
      if (oldCategory && oldCategory.name !== name) {
        const updatedProducts = products.map((product) =>
          product.category === oldCategory.name
            ? { ...product, category: name }
            : product
        );

        if (!saveProductList(updatedProducts)) {
          return;
        }
      }
    } else {
      updatedCategories = [
        ...categories,
        {
          id: Date.now(),
          name,
          icon: categoryForm.icon.trim() || "📦",
        },
      ];
    }

    const saved = storeCategories(updatedCategories);

    if (saved === false) {
      alert("Unable to save categories.");
      return;
    }

    setCategories(updatedCategories);
    setCategoryForm({ name: "", icon: "📦" });
    setEditingCategoryId(null);

    alert(
      editingCategoryId !== null
        ? "Category updated successfully."
        : "Category added successfully."
    );
  }

  function editCategory(category) {
    setCategoryForm({
      name: category.name,
      icon: category.icon || "📦",
    });

    setEditingCategoryId(category.id);
  }

  function cancelCategoryEdit() {
    setEditingCategoryId(null);
    setCategoryForm({ name: "", icon: "📦" });
  }

  function deleteCategory(id) {
    const category = categories.find(
      (item) => String(item.id) === String(id)
    );

    if (!category) return;

    const usedByProducts = products.filter(
      (product) =>
        product.category?.toLowerCase() ===
        category.name.toLowerCase()
    );

    if (usedByProducts.length > 0) {
      alert(
        `You cannot delete "${category.name}" because ${usedByProducts.length} product(s) are using this category. Edit those products first.`
      );
      return;
    }

    if (!window.confirm(`Delete "${category.name}" category?`)) {
      return;
    }

    const updated = categories.filter(
      (item) => String(item.id) !== String(id)
    );

    const saved = storeCategories(updated);

    if (saved === false) {
      alert("Unable to delete category.");
      return;
    }

    setCategories(updated);

    if (String(editingCategoryId) === String(id)) {
      cancelCategoryEdit();
    }

    alert("Category deleted successfully.");
  }

{/* COUPON MANAGEMENT */}
<div className="admin-orders">
  <div className="admin-section-heading">
    <div>
      <h2>Coupon Management</h2>
      <p>Create, edit and manage discount coupons.</p>
    </div>
  </div>

  <CouponManagement />
</div>


  // -----------------------------
  // ORDER MANAGEMENT
  // -----------------------------

  function updateStatus(orderId, newStatus) {
    let originalProducts = [];
    let stockChanged = false;

    try {
      const latestOrders = JSON.parse(
        localStorage.getItem("orders") || "[]"
      );

      const targetOrder = latestOrders.find(
        (order) => String(order.id) === String(orderId)
      );

      if (!targetOrder) {
        alert("Order not found.");
        return;
      }

      if (targetOrder.status === newStatus) return;

      originalProducts = getProducts();

      const quantities = new Map();

      (targetOrder.items || []).forEach((item) => {
        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("Invalid product quantity in this order.");
        }

        const id = String(item.id);

        quantities.set(
          id,
          (quantities.get(id) || 0) + quantity
        );
      });

      let updatedProducts = [...originalProducts];

      // Cancel order: restore stock once
      if (
        newStatus === "Cancelled" &&
        targetOrder.stockDeducted === true &&
        targetOrder.stockRestored !== true
      ) {
        updatedProducts = originalProducts.map((product) => {
          const quantity =
            quantities.get(String(product.id)) || 0;

          if (!quantity) return product;

          return {
            ...product,
            stock: Number(product.stock) + quantity,
          };
        });

        if (!storeProducts(updatedProducts)) {
          throw new Error("Unable to restore product stock.");
        }

        stockChanged = true;
      }

      // Reactivate cancelled order: deduct stock again
      if (
        targetOrder.status === "Cancelled" &&
        newStatus !== "Cancelled" &&
        targetOrder.stockDeducted === true &&
        targetOrder.stockRestored === true
      ) {
        for (const [id, quantity] of quantities) {
          const product = originalProducts.find(
            (item) => String(item.id) === id
          );

          if (!product || Number(product.stock) < quantity) {
            alert(
              "Insufficient stock to reactivate this order."
            );
            return;
          }
        }

        updatedProducts = originalProducts.map((product) => {
          const quantity =
            quantities.get(String(product.id)) || 0;

          if (!quantity) return product;

          return {
            ...product,
            stock: Number(product.stock) - quantity,
          };
        });

        if (!storeProducts(updatedProducts)) {
          throw new Error("Unable to update product stock.");
        }

        stockChanged = true;
      }

      const updatedOrders = latestOrders.map((order) => {
        if (String(order.id) !== String(orderId)) {
          return order;
        }

        return {
          ...order,
          status: newStatus,

          ...(newStatus === "Cancelled" &&
          order.stockDeducted === true
            ? { stockRestored: true }
            : {}),

          ...(order.status === "Cancelled" &&
          newStatus !== "Cancelled" &&
          order.stockDeducted === true
            ? { stockRestored: false }
            : {}),
        };
      });

      localStorage.setItem(
        "orders",
        JSON.stringify(updatedOrders)
      );

      setOrders(updatedOrders);

      if (stockChanged) {
        setProducts(updatedProducts);
      }

      window.dispatchEvent(new Event("ordersUpdated"));
      window.dispatchEvent(new Event("productsUpdated"));
    } catch (error) {
      console.error("Order status update error:", error);

      if (stockChanged) {
        storeProducts(originalProducts);
        setProducts(originalProducts);
      }

      alert(
        error.message ||
          "Unable to update order status. Please try again."
      );
    }
  }


  // -----------------------------
  // CUSTOMER MANAGEMENT
  // -----------------------------

  function toggleUserStatus(user) {
    const updatedUsers = customers.map((customer) => {
      const sameUser =
        String(customer.id || customer.email) ===
        String(user.id || user.email);

      return sameUser
        ? { ...customer, isBlocked: !customer.isBlocked }
        : customer;
    });

    try {
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      setCustomers(updatedUsers);

      window.dispatchEvent(new Event("usersUpdated"));

      alert(
        user.isBlocked
          ? "Customer unblocked successfully."
          : "Customer blocked successfully."
      );
    } catch (error) {
      console.error("User update error:", error);
      alert("Unable to update customer status.");
    }
  }

  // -----------------------------
  // FILTERS AND DASHBOARD STATS
  // -----------------------------

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = productSearch.toLowerCase();

      return (
        product.name?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search)
      );
    });
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const search = orderSearch.toLowerCase();

      const matchesSearch =
        String(order.id).toLowerCase().includes(search) ||
        order.customer?.name?.toLowerCase().includes(search) ||
        order.customer?.email?.toLowerCase().includes(search);

      const matchesStatus =
        orderFilter === "All" || order.status === orderFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((user) => {
      const search = customerSearch.toLowerCase();

      return (
        user.name?.toLowerCase().includes(search) ||
        user.fullName?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.phone?.toLowerCase().includes(search)
      );
    });
  }, [customers, customerSearch]);

  const totalSales = orders
    .filter((order) => order.status === "Delivered")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const blockedUsers = customers.filter(
    (user) => user.isBlocked
  ).length;

  const lowStockProducts = products.filter(
    (product) => Number(product.stock) <= 5
  );

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock) === 0
  );

  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: Package,
    },
    {
      title: "Total Sales",
      value: `Rs. ${totalSales.toLocaleString("en-PK")}`,
      icon: DollarSign,
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: ShoppingBag,
    },
    {
      title: "Total Products",
      value: products.length,
      icon: Package,
    },
    {
      title: "Total Users",
      value: customers.length,
      icon: Users,
    },
  ];

  // -----------------------------
  // PAGE UI
  // -----------------------------

  return (
    <div className="page-container admin-page">

      {/* DASHBOARD HEADING */}
      <div className="admin-heading">
        <div>
          <span className="eyebrow">STORE MANAGEMENT</span>
          <h1>Admin Dashboard</h1>
          <p>
            Manage your store products, categories, customers and orders.
          </p>
        </div>

        <button
          className="admin-refresh"
          type="button"
          onClick={refreshDashboard}
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>
      {/* DASHBOARD STATS */}
      <div className="admin-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="admin-stat-card" key={stat.title}>
              <div className="admin-stat-icon">
                <Icon />
              </div>

              <div>
                <p>{stat.title}</p>
                <h2>{stat.value}</h2>
              </div>
            </div>
          );
        })}
      </div>
        <SalesReports />
      {/* STOCK ALERTS */}
      <div className="admin-orders">
        <div className="admin-section-heading">
          <div>
            <h2>
              <AlertTriangle
                size={20}
                style={{ display: "inline", marginRight: 8 }}
              />
              Stock Alerts
            </h2>
            <p>Products that need restocking.</p>
          </div>

          <span>{lowStockProducts.length} Low Stock</span>
        </div>

        {lowStockProducts.length === 0 ? (
          <p>All products have sufficient stock.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Available Stock</th>
                  <th>Condition</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>
                      {Number(product.stock) === 0
                        ? "Out of Stock"
                        : "Low Stock"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-edit-btn"
                        onClick={() => editProduct(product)}
                      >
                        <Pencil size={16} />
                        Update Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.7 }}>
          Out of stock: {outOfStockProducts.length} products.
          Low stock alert appears when stock is 5 or less.
        </p>
      </div>

      {/* PRODUCT MANAGEMENT */}
      <div className="admin-orders">
        <div className="admin-section-heading">
          <div>
            <h2>All Products</h2>
            <p>Add, edit, search and manage your store products.</p>
          </div>

          <button
            className="admin-add-btn"
            type="button"
            onClick={() => {
              setForm({
                ...emptyProduct,
                category: categories[0]?.name || "",
              });
              setEditingId(null);
              setShowForm(true);
            }}
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>

        {showForm && (
          <form
            className="admin-product-form"
            onSubmit={handleSubmit}
          >
            <div className="admin-form-heading">
              <h3>
                {editingId !== null ? "Edit Product" : "Add New Product"}
              </h3>

              <button
                type="button"
                className="admin-close-btn"
                onClick={cancelProductForm}
              >
                <X />
              </button>
            </div>

            <div className="admin-form-grid">
              <input
                placeholder="Product Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
                required
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Old Price"
                value={form.oldPrice}
                onChange={(e) =>
                  setForm({ ...form, oldPrice: e.target.value })
                }
              />

              <input
                type="number"
                min="0"
                step="1"
                placeholder="Stock Quantity"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: e.target.value })
                }
                required
              />

              <input
                type="url"
                placeholder="Image URL (https://...)"
                value={form.image}
                onChange={(e) =>
                  setForm({ ...form, image: e.target.value })
                }
                required
              />

              <input
                placeholder="Badge (e.g. NEW or SALE)"
                value={form.badge}
                onChange={(e) =>
                  setForm({ ...form, badge: e.target.value })
                }
              />

              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="Rating"
                value={form.rating}
                onChange={(e) =>
                  setForm({ ...form, rating: e.target.value })
                }
              />

              <textarea
                placeholder="Product Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="admin-action-buttons">
              <button type="submit" className="admin-save-btn">
                <Save size={18} />
                {editingId !== null ? "Update Product" : "Save Product"}
              </button>

              <button
                type="button"
                className="admin-close-btn"
                onClick={cancelProductForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div style={{ margin: "18px 0" }}>
          <input
            type="search"
            placeholder="Search products by name or category..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img
                      className="admin-product-image"
                      src={product.image || "https://placehold.co/100x100"}
                      alt={product.name}
                    />
                  </td>

                  <td>
                    <strong>{product.name}</strong>
                  </td>

                  <td>{product.category}</td>

                  <td>
                    Rs. {Number(product.price).toLocaleString("en-PK")}
                  </td>

                  <td>
                    <strong
                      style={{
                        color:
                          Number(product.stock) <= 5
                            ? "#ef4444"
                            : "inherit",
                      }}
                    >
                      {product.stock}
                    </strong>
                  </td>

                  <td>
                    <div className="admin-action-buttons">
                      <button
                        className="admin-edit-btn"
                        type="button"
                        onClick={() => editProduct(product)}
                        title="Edit Product"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        className="admin-delete-btn"
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        title="Delete Product"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6">No matching products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CATEGORY MANAGEMENT */}
      <div className="admin-orders">
        <div className="admin-section-heading">
          <div>
            <h2>Category Management</h2>
            <p>Add, edit and manage product categories.</p>
          </div>

          <span>{categories.length} Categories</span>
        </div>

        <form
          className="admin-product-form"
          onSubmit={handleCategorySubmit}
        >
          <div className="admin-form-heading">
            <h3>
              {editingCategoryId !== null
                ? "Edit Category"
                : "Add New Category"}
            </h3>
          </div>

          <div className="admin-form-grid">
            <input
              placeholder="Category Name"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Category Icon (e.g. 🎧)"
              value={categoryForm.icon}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  icon: e.target.value,
                })
              }
            />
          </div>

          <div className="admin-action-buttons">
            <button type="submit" className="admin-save-btn">
              <Save size={18} />
              {editingCategoryId !== null
                ? "Update Category"
                : "Add Category"}
            </button>

            {editingCategoryId !== null && (
              <button
                type="button"
                className="admin-close-btn"
                onClick={cancelCategoryEdit}
              >
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Category Name</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => {
                const productCount = products.filter(
                  (product) =>
                    product.category?.toLowerCase() ===
                    category.name.toLowerCase()
                ).length;

                return (
                  <tr key={category.id}>
                    <td>
                      <span style={{ fontSize: 24 }}>
                        {category.icon}
                      </span>
                    </td>

                    <td>
                      <strong>{category.name}</strong>
                    </td>

                    <td>{productCount}</td>

                    <td>
                      <div className="admin-action-buttons">
                        <button
                          className="admin-edit-btn"
                          type="button"
                          onClick={() => editCategory(category)}
                          title="Edit Category"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="admin-delete-btn"
                          type="button"
                          onClick={() => deleteCategory(category.id)}
                          title="Delete Category"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {categories.length === 0 && (
                <tr>
                  <td colSpan="4">No categories available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER MANAGEMENT */}
      <div className="admin-orders">
        <div className="admin-section-heading">
          <div>
            <h2>Order Management</h2>
            <p>Search customer orders and update their status.</p>
          </div>

          <span>{orders.length} Orders</span>
        </div>

        <div className="admin-form-grid" style={{ marginBottom: 18 }}>
          <input
            type="search"
            placeholder="Search by order ID or customer..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
          />

          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
          >
            <option value="All">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <p style={{ marginBottom: 14, fontSize: 13, opacity: 0.7 }}>
          Delivered orders: {deliveredOrders}
        </p>

        {filteredOrders.length === 0 ? (
          <div className="admin-empty">
            <Package size={45} />
            <h3>No Orders Found</h3>
            <p>Try changing your search or status filter.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{String(order.id).slice(-8)}</td>

                    <td>
                      <strong>
                        {order.customer?.name || "Customer"}
                      </strong>
                      <small>
                        {order.customer?.phone || ""}
                      </small>
                      <small>
                        {order.customer?.email || order.email || ""}
                      </small>
                    </td>

                    <td>{order.items?.length || 0}</td>

                    <td>
                      Rs. {Number(order.total || 0).toLocaleString("en-PK")}
                    </td>

                    <td>{order.date || "-"}</td>

                    <td>
                      <select
                        className="admin-status-select"
                        value={order.status || "Pending"}
                        onChange={(e) =>
                          updateStatus(order.id, e.target.value)
                        }
                      >
                        <option>Pending</option>
                        <option>Shipped</option>
                        <option>Delivered</option>
                        <option>Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOMER MANAGEMENT */}
      <div className="admin-orders">
        <div className="admin-section-heading">
          <div>
            <h2>User Management</h2>
            <p>View customers and manage their account status.</p>
          </div>

          <span>{customers.length} Users</span>
        </div>

        <div className="admin-form-grid" style={{ marginBottom: 18 }}>
          <input
            type="search"
            placeholder="Search customers by name, email or phone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
        </div>

        <p style={{ marginBottom: 14, fontSize: 13, opacity: 0.7 }}>
          Blocked customers: {blockedUsers}
        </p>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((user, index) => (
                <tr key={user.id || user.email || index}>
                  <td>
                    <strong>
                      {user.name || user.fullName || "Customer"}
                    </strong>
                  </td>

                  <td>{user.email || "-"}</td>

                  <td>{user.phone || user.mobile || "-"}</td>

                  <td>
                    <span>
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className={
                        user.isBlocked
                          ? "admin-edit-btn"
                          : "admin-delete-btn"
                      }
                      onClick={() => toggleUserStatus(user)}
                      title={user.isBlocked ? "Unblock User" : "Block User"}
                    >
                      {user.isBlocked ? (
                        <UserCheck size={17} />
                      ) : (
                        <UserX size={17} />
                      )}

                      {user.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="5">No matching users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
