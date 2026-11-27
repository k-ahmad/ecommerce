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
  AlertTriangle,
} from "lucide-react";

import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct as removeProduct,
} from "../data/productStore";

import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory as removeCategory,
} from "../data/categoryStore";

import {
  fetchAllOrders,
  formatOrderDate,
  updateOrderStatus,
} from "../data/orderStore";

import { fetchUsers, toggleUserBlock } from "../data/adminStore";

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
  // LOAD DATA (sab kuch server se)
  // -----------------------------

  function showError(error) {
    alert(error?.message || "Something went wrong. Please try again.");
  }

  async function loadOrders() {
    try {
      setOrders(await fetchAllOrders());
    } catch (error) {
      console.error("Orders loading error:", error);
    }
  }

  async function loadProducts() {
    try {
      setProducts(await fetchProducts({ force: true }));
    } catch (error) {
      console.error("Products loading error:", error);
    }
  }

  async function loadCategories() {
    try {
      setCategories(await fetchCategories({ force: true }));
    } catch (error) {
      console.error("Categories loading error:", error);
    }
  }

  async function loadCustomers() {
    try {
      setCustomers(await fetchUsers());
    } catch (error) {
      console.error("Users loading error:", error);
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
  }, []);

  // -----------------------------
  // PRODUCT MANAGEMENT
  // -----------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    const name = form.name.trim();
    const price = Number(form.price);
    const oldPrice = Number(form.oldPrice || 0);
    const stock = Number(form.stock);

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
      stock < 0
    ) {
      alert("Please enter valid price and stock values.");
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

    // Rating customers ke reviews se khud banti hai, is liye nahi bhejte
    const productData = {
      name,
      category: form.category,
      price,
      oldPrice: oldPrice || null,
      stock,
      badge: form.badge.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
    };

    try {
      if (editingId !== null) {
        await updateProduct(editingId, productData);
      } else {
        await createProduct(productData);
      }

      await loadProducts();
      setForm(emptyProduct);
      setEditingId(null);
      setShowForm(false);
      alert(editingId !== null ? "Product updated!" : "Product added!");
    } catch (error) {
      showError(error);
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

  async function deleteProduct(id) {
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

    try {
      await removeProduct(id);
      setProducts((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );
      alert("Product deleted successfully.");
    } catch (error) {
      showError(error);
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

  async function handleCategorySubmit(e) {
    e.preventDefault();

    const name = categoryForm.name.trim();

    if (!name) {
      alert("Please enter a category name.");
      return;
    }

    const icon = categoryForm.icon.trim() || "📦";

    try {
      if (editingCategoryId !== null) {
        // Rename hone par server products ki category bhi badal deta hai
        await updateCategory(editingCategoryId, { name, icon });
      } else {
        await createCategory({ name, icon });
      }

      await Promise.all([loadCategories(), loadProducts()]);
      setCategoryForm({ name: "", icon: "📦" });
      setEditingCategoryId(null);

      alert(
        editingCategoryId !== null
          ? "Category updated successfully."
          : "Category added successfully."
      );
    } catch (error) {
      showError(error);
    }
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

  async function deleteCategory(id) {
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

    try {
      await removeCategory(id);
      await loadCategories();

      if (String(editingCategoryId) === String(id)) {
        cancelCategoryEdit();
      }

      alert("Category deleted successfully.");
    } catch (error) {
      showError(error);
    }
  }

  // -----------------------------
  // ORDER MANAGEMENT
  // -----------------------------

  async function updateStatus(orderId, newStatus) {
    const order = orders.find((item) => String(item.id) === String(orderId));
    if (!order || order.status === newStatus) return;

    if (
      newStatus === "Cancelled" &&
      !window.confirm("Cancel this order? Stock will be returned, and a cancelled order cannot be reopened.")
    ) {
      return;
    }

    try {
      // Cancel par stock server khud wapas karta hai
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );

      if (newStatus === "Cancelled") {
        loadProducts();
      }
    } catch (error) {
      showError(error);
      loadOrders();
    }
  }

  // -----------------------------
  // CUSTOMER MANAGEMENT
  // -----------------------------

  async function toggleUserStatus(user) {
    try {
      const updated = await toggleUserBlock(user.id);
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === updated.id ? updated : customer
        )
      );

      alert(
        updated.isBlocked
          ? "Customer blocked successfully."
          : "Customer unblocked successfully."
      );
    } catch (error) {
      showError(error);
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
        <SalesReports orders={orders} />

      {/* COUPON MANAGEMENT */}
      <CouponManagement />
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

                    <td>{formatOrderDate(order.created_at) || "-"}</td>

                    <td>
                      <select
                        className="admin-status-select"
                        value={order.status || "Pending"}
                        disabled={order.status === "Cancelled"}
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
