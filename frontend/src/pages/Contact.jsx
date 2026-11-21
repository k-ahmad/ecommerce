
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  ChevronDown,
  CheckCircle,
} from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [success, setSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      question: "How can I track my order?",
      answer:
        "You can visit the My Orders page after logging in to check your order status.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "Currently, we support Cash on Delivery (COD) for your convenience.",
    },
    {
      question: "Can I cancel my order?",
      answer:
        "You can contact our support team for help with cancellation. Your order status may affect cancellation availability.",
    },
    {
      question: "How can I contact customer support?",
      answer:
        "You can send us a message using the contact form or reach us through the contact details on this page.",
    },
  ];

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function sendMessage(e) {
    e.preventDefault();

    try {
      const messages = JSON.parse(
        localStorage.getItem("contactMessages") || "[]"
      );

      const newMessage = {
        id: Date.now(),
        ...form,
        date: new Date().toISOString(),
        status: "New",
      };

      localStorage.setItem(
        "contactMessages",
        JSON.stringify([...messages, newMessage])
      );

      setSuccess(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Message submission error:", error);
      alert("Unable to submit your message. Please try again.");
    }
  }

  return (
    <main className="contact-page">

      {/* HERO SECTION */}
      <section className="contact-hero">
        <div className="container">
          <span className="contact-eyebrow">GET IN TOUCH</span>

          <h1>
            We'd Love To <span>Hear From You</span>
          </h1>

          <p>
            Have a question, suggestion, or need help with your order?
            Our team is here to help you.
          </p>
        </div>
      </section>

      {/* CONTACT INFORMATION */}
      <section className="container contact-info-section">
        <div className="contact-info-card">
          <div className="contact-info-icon">
            <Mail />
          </div>
          <h3>Email Us</h3>
          <p>Send us your questions anytime.</p>
          <a href="mailto:support@novastore.com">
            support@novastore.com
          </a>
        </div>

        <div className="contact-info-card">
          <div className="contact-info-icon">
            <Phone />
          </div>
          <h3>Call Us</h3>
          <p>Talk to our support team.</p>
          <a href="tel:+923001234567">
            +92 300 1234567
          </a>
        </div>

        <div className="contact-info-card">
          <div className="contact-info-icon">
            <MapPin />
          </div>
          <h3>Our Location</h3>
          <p>Serving customers across Pakistan.</p>
          <span>Pakistan</span>
        </div>

        <div className="contact-info-card">
          <div className="contact-info-icon">
            <Clock />
          </div>
          <h3>Working Hours</h3>
          <p>Monday to Saturday</p>
          <span>9:00 AM - 6:00 PM</span>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className="container contact-main-section">
        <div className="contact-form-info">
          <span className="contact-eyebrow">CONTACT NOVA STORE</span>

          <h2>Let's Start A Conversation</h2>

          <p>
            Fill out the form and tell us how we can help.
            We appreciate your feedback and are always happy
            to hear from our customers.
          </p>

          <div className="contact-promise">
            <MessageCircle />
            <div>
              <h4>We're Here To Help</h4>
              <p>
                Your questions and feedback are important to us.
              </p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={sendMessage}>
          <h2>Send Us A Message</h2>

          {success && (
            <div className="contact-success">
              <CheckCircle size={20} />
              Your message has been saved successfully!
            </div>
          )}

          <div className="contact-input-grid">
            <div className="contact-field">
              <label>Your Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="contact-field">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="contact-field">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="03XXXXXXXXX"
              />
            </div>

            <div className="contact-field">
              <label>Subject *</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter subject"
                required
              />
            </div>
          </div>

          <div className="contact-field">
            <label>Your Message *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows="6"
              placeholder="Write your message here..."
              required
            />
          </div>

          <button type="submit" className="primary-btn contact-submit">
            Send Message <Send size={17} />
          </button>

          <p className="contact-form-note">
            * Required fields
          </p>
        </form>
      </section>

      {/* FAQ SECTION */}
      <section className="contact-faq-section">
        <div className="container">
          <div className="contact-faq-heading">
            <span className="contact-eyebrow">NEED HELP?</span>
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to some common questions.</p>
          </div>

          <div className="contact-faq-list">
            {faqs.map((faq, index) => (
              <div
                className={`contact-faq-item ${
                  openFaq === index ? "active" : ""
                }`}
                key={index}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? -1 : index)
                  }
                >
                  {faq.question}
                  <ChevronDown size={20} />
                </button>

                {openFaq === index && (
                  <p>{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
