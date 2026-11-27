
import { useMemo } from "react";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  CalendarDays,
} from "lucide-react";

const money = (value) =>
  Number(value || 0).toLocaleString("en-PK");

// Orders Admin page se aate hain (server se load hue)
export default function SalesReports({ orders = [] }) {
  const report = useMemo(() => {
    const delivered = orders.filter(
      (order) => order.status === "Delivered"
    );

    const sales = delivered.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const monthly = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const month = date.getMonth();

      const total = delivered
        .filter((order) => {
          const orderDate = new Date(order.created_at || order.date);
          return (
            !Number.isNaN(orderDate.getTime()) &&
            orderDate.getFullYear() === year &&
            orderDate.getMonth() === month
          );
        })
        .reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        );

      monthly.push({
        label: date.toLocaleDateString("en", {
          month: "short",
        }),
        total,
      });
    }

    const maxMonthly = Math.max(
      ...monthly.map((item) => item.total),
      1
    );

    const productMap = {};

    delivered.forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = item.name || "Product";

        if (!productMap[name]) {
          productMap[name] = {
            name,
            quantity: 0,
            revenue: 0,
          };
        }

        productMap[name].quantity += Number(item.quantity || 0);
        productMap[name].revenue +=
          Number(item.price || 0) * Number(item.quantity || 0);
      });
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const totalItems = delivered.reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce(
          (itemSum, item) =>
            itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );

    return {
      delivered,
      sales,
      monthly,
      maxMonthly,
      topProducts,
      totalItems,
    };
  }, [orders]);

  const stats = [
    {
      title: "Total Sales",
      value: `Rs. ${money(report.sales)}`,
      icon: DollarSign,
    },
    {
      title: "Delivered Orders",
      value: report.delivered.length,
      icon: ShoppingBag,
    },
    {
      title: "Products Sold",
      value: report.totalItems,
      icon: Package,
    },
    {
      title: "Average Order",
      value: `Rs. ${money(
        report.delivered.length
          ? report.sales / report.delivered.length
          : 0
      )}`,
      icon: TrendingUp,
    },
  ];

  return (
    <section className="sales-report">
      <div className="sales-report-heading">
        <div>
          <span className="sales-report-label">
            STORE ANALYTICS
          </span>
          <h2>Sales Reports</h2>
          <p>Your store sales and performance overview.</p>
        </div>

        <div className="sales-report-date">
          <CalendarDays size={16} />
          Last 6 Months
        </div>
      </div>

      <div className="sales-report-stats">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div className="sales-stat-card" key={item.title}>
              <div className="sales-stat-icon">
                <Icon size={21} />
              </div>

              <span>{item.title}</span>
              <strong>{item.value}</strong>
            </div>
          );
        })}
      </div>

      <div className="sales-report-grid">
        <div className="sales-chart-card">
          <div className="sales-card-heading">
            <div>
              <h3>Monthly Sales</h3>
              <p>Delivered orders revenue</p>
            </div>
            <TrendingUp size={21} />
          </div>

          <div className="sales-bars">
            {report.monthly.map((item) => (
              <div className="sales-bar-column" key={item.label}>
                <strong>Rs. {money(item.total)}</strong>

                <div className="sales-bar-track">
                  <div
                    className="sales-bar-fill"
                    style={{
                      height: `${
                        (item.total / report.maxMonthly) * 100
                      }%`,
                    }}
                  />
                </div>

                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sales-chart-card">
          <div className="sales-card-heading">
            <div>
              <h3>Top Selling Products</h3>
              <p>Products sold by quantity</p>
            </div>
            <Package size={21} />
          </div>

          {report.topProducts.length === 0 ? (
            <p className="sales-empty">
              No delivered product sales yet.
            </p>
          ) : (
            <div className="top-products-list">
              {report.topProducts.map((item, index) => (
                <div className="top-product-row" key={item.name}>
                  <span className="top-product-number">
                    {index + 1}
                  </span>

                  <div className="top-product-info">
                    <strong>{item.name}</strong>
                    <span>{item.quantity} units sold</span>
                  </div>

                  <strong>Rs. {money(item.revenue)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sales-report-bottom">
        <div>
          <span>All Orders</span>
          <strong>{orders.length}</strong>
        </div>

        <div>
          <span>Pending Orders</span>
          <strong>
            {orders.filter((o) => o.status === "Pending").length}
          </strong>
        </div>

        <div>
          <span>Processing Orders</span>
          <strong>
            {orders.filter((o) => o.status === "Processing").length}
          </strong>
        </div>

        <div>
          <span>Cancelled Orders</span>
          <strong>
            {orders.filter((o) => o.status === "Cancelled").length}
          </strong>
        </div>
      </div>
    </section>
  );
}
