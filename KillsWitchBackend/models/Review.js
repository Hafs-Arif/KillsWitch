module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Review', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
                isInt: true
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        reviewer_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 100]
            }
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'product_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        }
    }, {
        tableName: 'reviews',
        timestamps: true,
        indexes: [
            {
                fields: ['productId']
            },
            {
                fields: ['userId']
            },
            {
                fields: ['rating']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    Review.associate = (models) => {
        // A review belongs to a product
        Review.belongsTo(models.product, {
            foreignKey: 'productId',
            as: 'product',
            onDelete: 'CASCADE'
        });

        // A review optionally belongs to a user
        Review.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'SET NULL'
        });
    };

    return Review;
};
