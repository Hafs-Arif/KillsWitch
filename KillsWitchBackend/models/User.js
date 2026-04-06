module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      sparse: true,
    },
    isGoogleAuth: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phoneno: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
    },
    refreshtoken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sameShippingBillingDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
  User.associate = (models) => {
    User.hasMany(models.Contact, {
      foreignKey: "userId",
      as: "contacts",
    });

    User.hasMany(models.ActivityLog, {
      foreignKey: "user_email", // maps to ActivityLog.user_email
      sourceKey: "email", // maps to User.email
      as: "activityLogs",
    });

    User.hasMany(models.Cart, {
      foreignKey: "userId",
      as: "carts",
    });

    User.hasMany(models.Address, {
      foreignKey: "userId",
      as: "addresses",
    });
  };

  return User;
};
