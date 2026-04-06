const { Op } = require("sequelize");
const { literal } = require("sequelize");
const { ActivityLog, User } = require("../models");

const findByOrder = async (req, res) => {
  const { order_id } = req.query;
  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const logs = await ActivityLog.findAll({
      // details is JSONB; look for { order_id: <number> } inside it
      where: literal(
        `details @> '${JSON.stringify({
          order_id: parseInt(order_id),
        })}'::jsonb`
      ),
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const findAllLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.findAll();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const findUser = async (req, res) => {
  const { user_id } = req.query;

  try {
    if (user_id) {
      const users = await User.findOne({ where: { id: user_id } });
      if (!users) {
        return res.status(404).json({ message: "User Not Found" });
      }
      return res.json(users);
    }

    res.status(400).json({ message: "User ID is required" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getActivityLogs = async (req, res) => {
  const { email, order_id } = req.query;

  try {
    let activityLogs;

    if (order_id) {
      activityLogs = await ActivityLog.findAll({
        where: { order_id },
        order: [["created_at", "DESC"]],
      });
      return res.json(activityLogs);
    }

    if (email) {
      activityLogs = await ActivityLog.findAll({
        where: { user_email: email },
        order: [["created_at", "DESC"]],
      });
      return res.json(activityLogs);
    }

    res
      .status(400)
      .json({ message: "Please provide either email or order_id" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { findAllLogs, findUser, getActivityLogs, findByOrder };
