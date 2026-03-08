

module.exports = (sequelize, DataTypes) => {
    const category = sequelize.define('category',{
        product_category_id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
           // autoIncrement: true
        },
        category_name:{
            type:DataTypes.STRING
    
        }});
        category.associate = (models) => {
            category.hasMany(models.brandcategory, { foreignKey: 'category_id', as: 'brandcategory' });
      
          };
          
        return category;
    }