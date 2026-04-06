

module.exports = (sequelize, DataTypes) => {
    const subcategory = sequelize.define('subcategory',{
        sub_category_id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
           // autoIncrement: true
        },
        sub_category_name:{
            type:DataTypes.STRING    
        }});
     
          
        return subcategory;
    }