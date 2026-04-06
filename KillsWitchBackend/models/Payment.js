module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
      payment_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: false
      },
      payment_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      cardExpire: {
        type: DataTypes.STRING,
        allowNull: true // Allow null for COD payments
      },
      cardCVC: {
        type: DataTypes.STRING,
        allowNull: true // Allow null for COD payments
      },
      card_number: {
        type: DataTypes.STRING,
        allowNull: true // Allow null for COD payments
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
      
    });
  
    Payment.associate = (models) => {
      Payment.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
  
      Payment.hasOne(models.Order, {
        foreignKey: 'payment_id',
        as: 'order'
      });
    };
  
    return Payment;
  };