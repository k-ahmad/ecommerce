
import { useEffect, useState } from "react";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon as removeCoupon,
} from "../data/couponStore";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Tag,
} from "lucide-react";

export default function CouponManagement() {
  const emptyForm = {
    code: "",
    type: "percentage",
    value: "",
    minOrder: "0",
    expiry: "",
    active: true,
  };

  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function loadCoupons() {
    try {
      setCoupons(await fetchCoupons());
    } catch (error) {
      console.error("Coupons loading error:", error);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    const minOrder = Number(form.minOrder);

    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      alert("Coupon code must be 3-20 letters or numbers (no spaces or symbols).");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      alert("Please enter a valid discount value.");
      return;
    }

    if (
      form.type === "percentage" &&
      value > 100
    ) {
      alert("Percentage discount cannot be greater than 100.");
      return;
    }

    if (!Number.isFinite(minOrder) || minOrder < 0) {
      alert("Please enter a valid minimum order amount.");
      return;
    }

    const duplicate = coupons.some(
      (coupon) =>
        coupon.code.toUpperCase() === code &&
        String(coupon.id) !== String(editingId)
    );

    if (duplicate) {
      alert("This coupon code already exists.");
      return;
    }

    const couponData = {
      code,
      type: form.type,
      value,
      minOrder,
      expiry: form.expiry || null, // khali = kabhi expire nahi
      active: Boolean(form.active),
    };

    try {
      if (editingId !== null) {
        await updateCoupon(editingId, couponData);
      } else {
        await createCoupon(couponData);
      }

      await loadCoupons();
      resetForm();

      alert(
        editingId !== null
          ? "Coupon updated successfully."
          : "Coupon created successfully."
      );
    } catch (error) {
      alert(error.message);
    }
  }

  function editCoupon(coupon) {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrder: String(coupon.minOrder || 0),
      expiry: coupon.expiry || "",
      active: coupon.active,
    });

    setEditingId(coupon.id);
    setShowForm(true);
  }

  async function deleteCoupon(id) {
    const coupon = coupons.find(
      (item) => String(item.id) === String(id)
    );

    if (!window.confirm(`Delete coupon ${coupon?.code}?`)) {
      return;
    }

    try {
      await removeCoupon(id);
      setCoupons((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );

      if (String(editingId) === String(id)) {
        resetForm();
      }

      alert("Coupon deleted successfully.");
    } catch (error) {
      alert(error.message);
    }
  }

  async function toggleCoupon(coupon) {
    try {
      const updated = await updateCoupon(coupon.id, { active: !coupon.active });
      setCoupons((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <section className="admin-orders coupon-admin-section">
      <div className="admin-section-heading">
        <div>
          <h2>
            <Tag
              size={20}
              style={{ display: "inline", marginRight: 8 }}
            />
            Coupon Management
          </h2>
          <p>Create and manage discount codes for customers.</p>
        </div>

        <button
          type="button"
          className="admin-add-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Add Coupon
        </button>
      </div>

      {showForm && (
        <form
          className="admin-product-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-form-heading">
            <h3>
              {editingId !== null ? "Edit Coupon" : "Create Coupon"}
            </h3>

            <button
              type="button"
              className="admin-close-btn"
              onClick={resetForm}
            >
              <X />
            </button>
          </div>

          <div className="admin-form-grid">
            <input
              placeholder="Coupon Code e.g. NOVA20"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase(),
                })
              }
              required
            />

            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
            >
              <option value="percentage">Percentage Discount (%)</option>
              <option value="fixed">Fixed Discount (Rs.)</option>
            </select>

            <input
              type="number"
              min="1"
              max={form.type === "percentage" ? "100" : undefined}
              placeholder={
                form.type === "percentage"
                  ? "Discount Percentage"
                  : "Discount Amount in Rs."
              }
              value={form.value}
              onChange={(e) =>
                setForm({ ...form, value: e.target.value })
              }
              required
            />

            <input
              type="number"
              min="0"
              placeholder="Minimum Order Amount (Rs.)"
              value={form.minOrder}
              onChange={(e) =>
                setForm({ ...form, minOrder: e.target.value })
              }
              required
            />

            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={form.expiry}
              onChange={(e) =>
                setForm({ ...form, expiry: e.target.value })
              }
              title="Leave empty for a coupon that never expires"
            />

            <select
              value={form.active ? "active" : "inactive"}
              onChange={(e) =>
                setForm({
                  ...form,
                  active: e.target.value === "active",
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="admin-action-buttons">
            <button
              type="submit"
              className="admin-save-btn"
            >
              <Save size={18} />
              {editingId !== null ? "Update Coupon" : "Save Coupon"}
            </button>

            <button
              type="button"
              className="admin-close-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Discount</th>
              <th>Minimum Order</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td>
                  <strong>{coupon.code}</strong>
                </td>

                <td>
                  {coupon.type === "percentage"
                    ? `${coupon.value}%`
                    : `Rs. ${Number(coupon.value).toLocaleString("en-PK")}`}
                </td>

                <td>
                  Rs. {Number(coupon.minOrder).toLocaleString("en-PK")}
                </td>

                <td>{coupon.expiry || "No expiry"}</td>

                <td>
                  <button
                    type="button"
                    className={
                      coupon.active
                        ? "admin-edit-btn"
                        : "admin-delete-btn"
                    }
                    onClick={() => toggleCoupon(coupon)}
                  >
                    {coupon.active ? "Active" : "Inactive"}
                  </button>
                </td>

                <td>
                  <div className="admin-action-buttons">
                    <button
                      type="button"
                      className="admin-edit-btn"
                      onClick={() => editCoupon(coupon)}
                      title="Edit Coupon"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => deleteCoupon(coupon.id)}
                      title="Delete Coupon"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {coupons.length === 0 && (
              <tr>
                <td colSpan="6">No coupons created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
