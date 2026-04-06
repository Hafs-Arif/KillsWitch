module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
      order_item_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      condition: {
        type: DataTypes.STRING,
        defaultValue: 'NEW'
      },
      isFullCart: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      tableName: 'order_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  
    OrderItem.associate = (models) => {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order',
        onDelete: 'CASCADE'
      });
  
      OrderItem.belongsTo(models.product, {
        foreignKey: 'productId',
        as: 'product',
        onDelete: 'CASCADE'
      });
    };
  
    return OrderItem;
  };
  