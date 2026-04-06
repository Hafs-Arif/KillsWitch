module.exports = (sequelize, DataTypes) => {
  const AdminRequest = sequelize.define(
    "AdminRequest", // Correct model name
    {
      admin_request_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      IsApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      user_email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true, // Add unique if you want to reference this as FK
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedshippingAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updatedshippingPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "AdminRequest", // Make sure this matches the intended table name
    }
  );

  return AdminRequest;
};
