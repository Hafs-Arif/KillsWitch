module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        sessionId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'For guest users - stores session ID'
        },
        status: {
            type: DataTypes.ENUM('active', 'abandoned', 'converted'),
            defaultValue: 'active',
            allowNull: false
        },
        totalItems: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            validate: {
                min: 0
            }
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: false,
            validate: {
                min: 0
            }
        },
        currency: {
            type: DataTypes.STRING(3),
            defaultValue: 'USD',
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Cart expiration date for cleanup'
        }
    }, {
        tableName: 'carts',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['sessionId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['expiresAt']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    Cart.associate = (models) => {
        // A cart belongs to a user
        Cart.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'CASCADE'
        });

        // A cart has many cart items
        Cart.hasMany(models.CartItem, {
            foreignKey: 'cartId',
            as: 'items',
            onDelete: 'CASCADE'
        });
    };

    // Instance methods
    Cart.prototype.calculateTotals = async function() {
        const items = await this.getItems();
        let totalItems = 0;
        let totalAmount = 0;

        for (const item of items) {
            totalItems += item.quantity;
            totalAmount += item.quantity * item.price;
        }

        this.totalItems = totalItems;
        this.totalAmount = totalAmount;
        await this.save();
        
        return { totalItems, totalAmount };
    };

    Cart.prototype.isEmpty = function() {
        return this.totalItems === 0;
    };

    Cart.prototype.clear = async function() {
        const items = await this.getItems();
        for (const item of items) {
            await item.destroy();
        }
        this.totalItems = 0;
        this.totalAmount = 0;
        await this.save();
    };

    return Cart;
};
