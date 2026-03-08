module.exports = (sequelize, DataTypes) => {
    const ProductImage = sequelize.define('ProductImage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    ProductImage.associate = (models) => {
        ProductImage.belongsTo(models.product, {
            foreignKey: 'productId',
            as: 'product'
        });
    };

    return ProductImage;
};
