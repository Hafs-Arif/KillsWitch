module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    order_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    order_status: { 
      type: DataTypes.STRING, 
      allowNull: false,
      defaultValue: 'processing',
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Shipping information
    shippingName: { type: DataTypes.STRING, allowNull: false },
    shippingMethod: { type: DataTypes.STRING, allowNull: true },
    shippingCompany: { type: DataTypes.STRING, allowNull: true },
    shippingPhone: { type: DataTypes.STRING, allowNull: false },
    shippingAddress: { type: DataTypes.TEXT, allowNull: false },
    shippingCity: { type: DataTypes.STRING, allowNull: false },
    shippingState: { type: DataTypes.STRING, allowNull: false },
    shippingCountry: { type: DataTypes.STRING, allowNull: false },
    // Billing information
    billingName: { type: DataTypes.STRING, allowNull: false },
    billingCompany: { type: DataTypes.STRING, allowNull: true },
    billingPhone: { type: DataTypes.STRING, allowNull: false },
    billingAddress: { type: DataTypes.TEXT, allowNull: false },
    billingCity: { type: DataTypes.STRING, allowNull: false },
    billingState: { type: DataTypes.STRING, allowNull: false },
    billingCountry: { type: DataTypes.STRING, allowNull: false },
    // Order totals
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    shipping_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'shipping' },
    tax: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'total' },
    couponCode: { type: DataTypes.STRING, allowNull: true },
    discount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    isFullCart: { type: DataTypes.BOOLEAN, defaultValue: false },
    leadtime: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for guest orders
    },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Order.belongsTo(models.Shipment, {
      foreignKey: "shipment_id",
      as: "shipment",
    });
    Order.belongsTo(models.Payment, {
      foreignKey: "payment_id",
      as: "payment",
    });
    Order.hasMany(models.OrderItem, { foreignKey: "orderId", as: "orderItem" });
    Order.hasMany(models.ActivityLog, { foreignKey: "order_id" });
  };

  return Order;
};
