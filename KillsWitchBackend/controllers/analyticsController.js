const db = require("../models");
const { Op } = require("sequelize");

// models are registered with specific case in models/index.js
// make sure we use the exact key names to avoid undefined references
const Order = db.Order;           // capital "O" as defined in index.js
const Product = db.product;       // lowercase is correct here
const Category = db.category;     // lowercase in index.js
const Brand = db.brand;           // lowercase in index.js
const User = db.User;             // uppercase in index.js

// Get comprehensive analytics dashboard data
exports.getDashboardAnalytics = async (req, res) => {
  try {
    console.log("📊 Fetching analytics data...");

    // Fetch all data with error handling
    let orders = [];
    let products = [];
    let categories = [];
    let brands = [];
    let users = [];

    if (Order) {
      try {
        orders = await Order.findAll({ raw: true });
        console.log("✅ Orders fetched:", orders.length);
      } catch (err) {
        console.warn("⚠️ Could not fetch orders:", err.message);
      }
    }

    if (Product) {
      try {
        products = await Product.findAll({ raw: true });
        console.log("✅ Products fetched:", products.length);
      } catch (err) {
        console.warn("⚠️ Could not fetch products:", err.message);
      }
    }

    if (Category) {
      try {
        categories = await Category.findAll({ raw: true });
        console.log("✅ Categories fetched:", categories.length);
      } catch (err) {
        console.warn("⚠️ Could not fetch categories:", err.message);
      }
    }

    if (Brand) {
      try {
        brands = await Brand.findAll({ raw: true });
        console.log("✅ Brands fetched:", brands.length);
      } catch (err) {
        console.warn("⚠️ Could not fetch brands:", err.message);
      }
    }

    if (User) {
      try {
        users = await User.findAll({ raw: true });
        console.log("✅ Users fetched:", users.length);
      } catch (err) {
        console.warn("⚠️ Could not fetch users:", err.message);
      }
    }

    // Calculate totals
    const totalOrders = orders.length || 0;
    const totalProducts = products.length || 0;
    const totalCategories = categories.length || 0;
    const totalBrands = brands.length || 0;
    const totalUsers = users.length || 0;

    // Calculate revenue and completed orders
    let revenue = 0;
    let completedOrders = 0;

    // dynamic status breakdown map
    const orderStatusBreakdown = {};

    if (Array.isArray(orders) && orders.length > 0) {
      orders.forEach((order) => {
        // Calculate revenue - try multiple field names
        const orderTotal =
          Number(order.total) ||
          Number(order.order_total) ||
          Number(order.amount) ||
          Number(order.total_amount) ||
          0;
        revenue += orderTotal;

        // Normalize status (prefer whatever field exists)
        let statusRaw = order.order_status || order.status || order.orderstatus || "";
        let status = statusRaw.toString().trim().toUpperCase();
        if (!status) status = "PENDING";

        // increment count for this status
        orderStatusBreakdown[status] = (orderStatusBreakdown[status] || 0) + 1;

        // determine if this order should count as completed
        // treat delivered/completed/confirm/COD_CONFIRMED as finished
        if (
          status === "DELIVERED" ||
          status === "COMPLETED" ||
          status === "CONFIRM" ||
          status === "COD_CONFIRMED" ||
          status.includes("CONFIRM")
        ) {
          completedOrders++;
        }
      });
    }

    console.log("📊 Analytics Summary:", {
      totalOrders,
      completedOrders,
      revenue,
      totalProducts,
      totalCategories,
      totalBrands,
      totalUsers,
      orderStatusBreakdown,
    });

    return res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        revenue: Math.round(revenue * 100) / 100, // Round to 2 decimals
        totalProducts,
        totalCategories,
        totalBrands,
        totalUsers,
        orderStatusBreakdown,
        summary: {
          averageOrderValue:
            totalOrders > 0
              ? Math.round((revenue / totalOrders) * 100) / 100
              : 0,
          completionRate:
            totalOrders > 0
              ? Math.round((completedOrders / totalOrders) * 100)
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("❌ Analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
      error: error.message,
    });
  }
};

// Get summary only (faster endpoint)
exports.getSummary = async (req, res) => {
  try {
    console.log("📋 Fetching summary...");

    let orders = [];
    let products = [];
    let categories = [];
    let brands = [];
    let users = [];

    if (Order) {
      try {
        orders = await Order.findAll({ raw: true });
      } catch (err) {
        console.warn("⚠️ Could not fetch orders:", err.message);
      }
    }

    if (Product) {
      try {
        products = await Product.findAll({ raw: true });
      } catch (err) {
        console.warn("⚠️ Could not fetch products:", err.message);
      }
    }

    if (Category) {
      try {
        categories = await Category.findAll({ raw: true });
      } catch (err) {
        console.warn("⚠️ Could not fetch categories:", err.message);
      }
    }

    if (Brand) {
      try {
        brands = await Brand.findAll({ raw: true });
      } catch (err) {
        console.warn("⚠️ Could not fetch brands:", err.message);
      }
    }

    if (User) {
      try {
        users = await User.findAll({ raw: true });
      } catch (err) {
        console.warn("⚠️ Could not fetch users:", err.message);
      }
    }

    let revenue = 0;
    let completedOrders = 0;

    if (Array.isArray(orders) && orders.length > 0) {
      orders.forEach((order) => {
        const orderTotal =
          Number(order.total) ||
          Number(order.order_total) ||
          Number(order.amount) ||
          Number(order.total_amount) ||
          0;
        revenue += orderTotal;

        let statusRaw = order.order_status || order.status || order.orderstatus || "";
        let status = statusRaw.toString().trim().toUpperCase();
        if (!status) status = "PENDING";
        if (
          status === "DELIVERED" ||
          status === "COMPLETED" ||
          status === "CONFIRM" ||
          status === "COD_CONFIRMED" ||
          status.includes("CONFIRM")
        ) {
          completedOrders++;
        }
      });
    }

    return res.json({
      totalOrders: orders.length || 0,
      completedOrders,
      revenue: Math.round(revenue * 100) / 100,
      totalProducts: products.length || 0,
      totalCategories: categories.length || 0,
      totalBrands: brands.length || 0,
      totalUsers: users.length || 0,
    });
  } catch (error) {
    console.error("❌ Summary error:", error);
    return res.status(500).json({
      message: "Failed to fetch summary data",
      error: error.message,
    });
  }
};

// Get order status breakdown
exports.getOrderStatusBreakdown = async (req, res) => {
  try {
    console.log("📦 Fetching order status breakdown...");

    let orders = [];

    if (Order) {
      try {
        orders = await Order.findAll({ raw: true });
        console.log("✅ Orders for breakdown:", orders.length);
      } catch (err) {
        console.warn("⚠️ Could not fetch orders:", err.message);
      }
    }

    // build a dynamic breakdown object keyed by actual status values
    const breakdown = {};

    if (Array.isArray(orders) && orders.length > 0) {
      orders.forEach((order) => {
        let statusRaw = order.order_status || order.status || order.orderstatus || "";
        let status = statusRaw.toString().trim().toUpperCase();
        if (!status) status = "PENDING";

        breakdown[status] = (breakdown[status] || 0) + 1;
      });
    }

    console.log("📊 Order breakdown:", breakdown);

    return res.json({
      success: true,
      data: breakdown,
      total: orders.length,
    });
  } catch (error) {
    console.error("❌ Order breakdown error:", error);
    return res.status(500).json({
      message: "Failed to fetch order status breakdown",
      error: error.message,
    });
  }
};
