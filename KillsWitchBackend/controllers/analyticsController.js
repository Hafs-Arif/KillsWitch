// controllers/analyticsController.js  –  raw SQL (pg)
// Uses aggregation queries instead of loading all rows into JS memory.
"use strict";

const { query } = require("../config/db");

// ── Full dashboard ────────────────────────────────────────────────────────────
exports.getDashboardAnalytics = async (_req, res) => {
  try {
    // All counts + revenue in a single round-trip
    const { rows: totals } = await query(
      `SELECT
         (SELECT COUNT(*)                           FROM orders)    AS total_orders,
         (SELECT COALESCE(SUM(total_price), 0)      FROM orders)    AS revenue,
         (SELECT COUNT(*)                           FROM products)  AS total_products,
         (SELECT COUNT(*)                           FROM categories)AS total_categories,
         (SELECT COUNT(*)                           FROM brands)    AS total_brands,
         (SELECT COUNT(*)                           FROM users)     AS total_users`
    );

    const { rows: statusRows } = await query(
      `SELECT UPPER(TRIM(order_status)) AS status, COUNT(*) AS count
       FROM orders GROUP BY UPPER(TRIM(order_status))`
    );

    const t = totals[0];
    const orderStatusBreakdown = {};
    let completedOrders = 0;
    const COMPLETE_STATUSES = new Set(["DELIVERED","COMPLETED","CONFIRM","COD_CONFIRMED"]);

    for (const r of statusRows) {
      const s   = r.status || "PENDING";
      const cnt = parseInt(r.count, 10);
      orderStatusBreakdown[s] = cnt;
      if (COMPLETE_STATUSES.has(s) || s.includes("CONFIRM")) completedOrders += cnt;
    }

    const totalOrders = parseInt(t.total_orders, 10);
    const revenue     = parseFloat(t.revenue);

    return res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        revenue:          Math.round(revenue * 100) / 100,
        totalProducts:    parseInt(t.total_products,    10),
        totalCategories:  parseInt(t.total_categories,  10),
        totalBrands:      parseInt(t.total_brands,      10),
        totalUsers:       parseInt(t.total_users,       10),
        orderStatusBreakdown,
        summary: {
          averageOrderValue: totalOrders > 0 ? Math.round((revenue / totalOrders) * 100) / 100 : 0,
          completionRate:    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        },
      },
    });
  } catch (err) {
    console.error("getDashboardAnalytics:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
};

// ── Summary (lightweight) ─────────────────────────────────────────────────────
exports.getSummary = async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         (SELECT COUNT(*)                      FROM orders)    AS total_orders,
         (SELECT COALESCE(SUM(total_price),0)  FROM orders)    AS revenue,
         (SELECT COUNT(*)                      FROM products)  AS total_products,
         (SELECT COUNT(*)                      FROM categories)AS total_categories,
         (SELECT COUNT(*)                      FROM brands)    AS total_brands,
         (SELECT COUNT(*)                      FROM users)     AS total_users`
    );
    const { rows: statusRows } = await query(
      `SELECT UPPER(TRIM(order_status)) AS status, COUNT(*) AS count
       FROM orders GROUP BY UPPER(TRIM(order_status))`
    );

    const COMPLETE_STATUSES = new Set(["DELIVERED","COMPLETED","CONFIRM","COD_CONFIRMED"]);
    let completedOrders = 0;
    for (const r of statusRows) {
      const s = r.status || "PENDING";
      if (COMPLETE_STATUSES.has(s) || s.includes("CONFIRM"))
        completedOrders += parseInt(r.count, 10);
    }

    const t = rows[0];
    return res.json({
      totalOrders:     parseInt(t.total_orders, 10),
      completedOrders,
      revenue:         Math.round(parseFloat(t.revenue) * 100) / 100,
      totalProducts:   parseInt(t.total_products,   10),
      totalCategories: parseInt(t.total_categories, 10),
      totalBrands:     parseInt(t.total_brands,     10),
      totalUsers:      parseInt(t.total_users,      10),
    });
  } catch (err) {
    console.error("getSummary:", err.message);
    return res.status(500).json({ message: "Failed to fetch summary" });
  }
};

// ── Order status breakdown ────────────────────────────────────────────────────
exports.getOrderStatusBreakdown = async (_req, res) => {
  try {
    const { rows }  = await query(
      `SELECT UPPER(TRIM(order_status)) AS status, COUNT(*) AS count
       FROM orders GROUP BY UPPER(TRIM(order_status)) ORDER BY count DESC`
    );
    const { rows: total } = await query("SELECT COUNT(*) AS n FROM orders");

    const breakdown = {};
    for (const r of rows) breakdown[r.status || "PENDING"] = parseInt(r.count, 10);

    return res.json({ success: true, data: breakdown, total: parseInt(total[0].n, 10) });
  } catch (err) {
    console.error("getOrderStatusBreakdown:", err.message);
    return res.status(500).json({ message: "Failed to fetch breakdown" });
  }
};