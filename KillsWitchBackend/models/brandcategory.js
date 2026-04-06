
module.exports = (sequelize, DataTypes) => {
  const brandcategory = sequelize.define('brandcategory', {
    id:{
      type:DataTypes.INTEGER,
      primaryKey:true,
      //autoIncrement: true
  },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sub_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'brandcategory' // <-- optional, force specific table name
  });
  brandcategory.associate = (models) => {
    brandcategory.hasMany(models.product, {
      foreignKey: 'brandcategoryId',
      as: 'product'
    });

    brandcategory.belongsTo(models.brand, {
      foreignKey: 'brand_id',
      as: 'brand',
      onDelete: 'CASCADE',  // optional: handle deletion behavior
      onUpdate: 'CASCADE' 
    });
    brandcategory.belongsTo(models.category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    brandcategory.belongsTo(models.subcategory, {
      foreignKey: 'sub_category_id',
      as: 'subcategory'
    });
  };
   return brandcategory;
};
