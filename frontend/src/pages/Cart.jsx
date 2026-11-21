
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";

export default function Cart({
  cart,
  updateQuantity,
  removeFromCart,
  toggleSelection,
}) {
  const navigate = useNavigate();

  const selectedItems = cart.filter((item) => item.selected);

  const total = selectedItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const allSelected =
    cart.length > 0 && cart.every((item) => item.selected);

  function selectAll(checked) {
    cart.forEach((item) => {
      if (item.selected !== checked) {
        toggleSelection(item.id);
      }
    });
  }

  if (cart.length === 0) {
    return (
      <div className="page-container empty-cart">
        <ShoppingBag size={55} />
        <h2>Your Cart is Empty</h2>
        <p>You haven't added any products yet.</p>
        <Link to="/products" className="primary-btn">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Shopping Cart</h1>
      <p>Select the products you want to order.</p>

      <div className="select-all-row">
        <label>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => selectAll(e.target.checked)}
          />
          Select All Products
        </label>

        <span>{selectedItems.length} of {cart.length} selected</span>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <div
              className={`cart-item ${!item.selected ? "cart-item-unselected" : ""}`}
              key={item.id}
            >
              <input
                className="cart-select"
                type="checkbox"
                checked={!!item.selected}
                onChange={() => toggleSelection(item.id)}
                aria-label={`Select ${item.name}`}
              />

              <img src={item.image} alt={item.name} />

              <div className="cart-item-info">
                <h3>{item.name}</h3>

                <p>
                  Rs. {Number(item.price).toLocaleString("en-PK")}
                </p>

                <div className="quantity-controls">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              <button
                className="remove-btn"
                onClick={() => removeFromCart(item.id)}
                aria-label="Remove product"
              >
                <Trash2 size={19} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Selected Products</span>
            <strong>{selectedItems.length}</strong>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>Rs. {total.toLocaleString("en-PK")}</strong>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <strong>Free</strong>
          </div>

          <div className="summary-row total-row">
            <span>Total</span>
            <strong>Rs. {total.toLocaleString("en-PK")}</strong>
          </div>

          <button
            className="primary-btn checkout-btn"
            disabled={selectedItems.length === 0}
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>

          <Link to="/products" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
