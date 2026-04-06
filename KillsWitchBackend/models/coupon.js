module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      set(value) {
        // always store uppercase codes
        this.setDataValue('code', (value || '').toString().trim().toUpperCase());
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discount_type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage'
    },
    discount_value: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    min_purchase_amount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    max_uses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    uses_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  });

  // no associations for now

  return Coupon;
};
