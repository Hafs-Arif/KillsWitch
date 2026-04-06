// models/shipment.model.js

module.exports = (sequelize, DataTypes) => {
    const Shipment = sequelize.define('Shipment', {
      shipment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      shippingName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shippingPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shippingMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shippingAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shippingDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      shippingCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shippingState: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shippingCountry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shippingCompany: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingCompany: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingState: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingCountry: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    }, {
      tableName: 'shipments',
      timestamps: false // set to true if you want createdAt/updatedAt
    });
  
    Shipment.associate = (models) => {
      Shipment.hasOne(models.Order, {
        foreignKey: 'shipment_id',
        as: 'order'
      });
    };
  
    return Shipment;
  };