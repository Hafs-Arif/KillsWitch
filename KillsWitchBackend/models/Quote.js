module.exports = (sequelize, DataTypes) => {
    const Quote = sequelize.define('Quote', {
      quote_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false
      },
      condition: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      phoneno: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      target_price: {
        type: DataTypes.DECIMAL,
        allowNull: false
      }
    }, {
      tableName: 'quotes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  
    Quote.associate = (models) => {
      Quote.belongsTo(models.product, {
        foreignKey: 'Product_name', // You need to make sure the foreign key matches
        as: 'product'
      });
    };
  
    return Quote;
  };
  