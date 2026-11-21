import {
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  Headphones,
  Target,
  Eye,
  Star,
  Award,
  Users,
} from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <ShieldCheck size={28} />,
      title: "Quality Products",
      description:
        "We focus on offering quality products that bring value to your everyday life.",
    },
    {
      icon: <Truck size={28} />,
      title: "Reliable Delivery",
      description:
        "We aim to make receiving your favorite products simple and convenient.",
    },
    {
      icon: <Headphones size={28} />,
      title: "Customer Support",
      description:
        "Your shopping experience matters. We are here to help whenever you need us.",
    },
    {
      icon: <Heart size={28} />,
      title: "Customer First",
      description:
        "Customer satisfaction is at the heart of everything we do.",
    },
  ];

  return (
    <main className="container section page about-page">

      {/* HERO SECTION */}
      <section className="about-hero">
        <span className="eyebrow">WHO WE ARE</span>

        <h1 className="section-heading">
          More Than Shopping.
          <br />
          <span>It's NOVA STORE.</span>
        </h1>

        <p className="section-subtitle">
          Welcome to NovaStore, your destination for discovering
          quality products, modern style and a simple online
          shopping experience.
        </p>

        <div className="about-hero-tag">
          <ShoppingBag size={20} />
          <span>Discover. Shop. Enjoy.</span>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="about-story">
        <div className="about-section-label">
          <span>01</span>
          <p>OUR STORY</p>
        </div>

        <h2>
          Shopping Made
          <span> Simple & Better.</span>
        </h2>

        <p>
          NovaStore was created with a simple idea: make online
          shopping easy, convenient and enjoyable for everyone.
          We bring together products from different categories
          so customers can discover useful items in one place.
        </p>

        <p>
          From electronics and fashion to accessories and lifestyle
          products, our goal is to provide a smooth shopping journey
          from browsing products to placing an order.
        </p>
      </section>

      {/* MISSION AND VISION */}
      <section className="about-purpose">

        <div className="about-purpose-card">
          <div className="about-icon">
            <Target size={30} />
          </div>

          <span>OUR MISSION</span>

          <h3>Make Shopping Easy</h3>

          <p>
            Our mission is to make quality products accessible
            through a convenient, simple and enjoyable online
            shopping experience.
          </p>
        </div>

        <div className="about-purpose-card">
          <div className="about-icon">
            <Eye size={30} />
          </div>

          <span>OUR VISION</span>

          <h3>Build Customer Trust</h3>

          <p>
            Our vision is to build a trusted online shopping
            destination where customers feel confident and
            satisfied with every purchase.
          </p>
        </div>

      </section>

      {/* WHY CHOOSE US */}
      <section className="about-why">

        <div className="about-section-label">
          <span>02</span>
          <p>WHY CHOOSE US</p>
        </div>

        <h2>
          Why Shop With
          <span> NovaStore?</span>
        </h2>

        <p className="about-section-description">
          We want every customer to enjoy a simple and reliable
          shopping experience.
        </p>

        <div className="feature-grid about-features">

          {features.map((feature, index) => (
            <div className="feature-item about-feature-card" key={index}>

              <div className="about-icon">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

            </div>
          ))}

        </div>
      </section>

      {/* STORE VALUES */}
      <section className="about-values">

        <div className="about-value-item">
          <Star size={27} />
          <h3>Our Promise</h3>
          <p>
            A better shopping experience with every visit.
          </p>
        </div>

        <div className="about-value-item">
          <Award size={27} />
          <h3>Our Standard</h3>
          <p>
            Quality, convenience and customer satisfaction.
          </p>
        </div>

        <div className="about-value-item">
          <Users size={27} />
          <h3>Our Customers</h3>
          <p>
            Your trust and satisfaction always matter.
          </p>
        </div>

      </section>

      {/* FINAL CTA */}
      <section className="about-cta">

        <span className="eyebrow">START EXPLORING</span>

        <h2>
          Find Something
          <span> You'll Love.</span>
        </h2>

        <p>
          Explore our collection and discover products
          that fit your everyday needs.
        </p>

        <a href="/products" className="primary-btn">
          Explore Products
          <ShoppingBag size={18} />
        </a>

      </section>

    </main>
  );
}
