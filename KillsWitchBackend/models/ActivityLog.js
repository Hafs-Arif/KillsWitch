module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    "ActivityLog",
    {
      activity_logs_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      activity: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      user_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: "activity_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.Order, {
      foreignKey: "order_id",
      as: "order",
    });

    ActivityLog.belongsTo(models.User, {
      foreignKey: "user_email", // FK in ActivityLog
      targetKey: "email", // maps to User.email
      as: "user",
    });
  };

  return ActivityLog;
};
