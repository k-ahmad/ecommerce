
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div>
          <Link to="/" className="logo">NOVA<span>STORE.</span></Link>
          <p>Quality products. Better shopping experience.</p>
        </div>
        <div className="footer-links">
          <Link to="/products">Shop</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Account</Link>
          <Link to="/orders">Orders</Link>
        </div>
        <p className="copyright">
            © {new Date().getFullYear()} NovaStore. All rights reserved.
          </p>
      </div>
    </footer>
  );
}
