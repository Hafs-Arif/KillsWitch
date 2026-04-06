const { brandcategory } = require(".");


module.exports = (sequelize, DataTypes) => {
    const brand = sequelize.define('brand',{
        brand_id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
          //  autoIncrement: true
        },
        brand_name:{
            type:DataTypes.STRING
        }
    });

    brand.associate = (models) => {
            brand.hasMany(models.brandcategory, { foreignKey: 'brand_id', as: 'brandcategory' });
    };
    return brand;
}