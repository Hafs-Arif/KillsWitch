module.exports = (sequelize, DataTypes) => {
    const CartItem = sequelize.define('CartItem', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        cartId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'carts',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
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
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 999
            }
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            comment: 'Price at the time of adding to cart'
        },
        totalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            comment: 'quantity * price'
        },
        productSnapshot: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Snapshot of product data at time of adding to cart'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Special notes for this cart item'
        }
    }, {
        tableName: 'cart_items',
        timestamps: true,
        indexes: [
            {
                fields: ['cartId']
            },
            {
                fields: ['productId']
            },
            {
                fields: ['cartId', 'productId'],
                unique: true,
                name: 'unique_cart_product'
            }
        ]
    });

    CartItem.associate = (models) => {
        // A cart item belongs to a cart
        CartItem.belongsTo(models.Cart, {
            foreignKey: 'cartId',
            as: 'cart',
            onDelete: 'CASCADE'
        });

        // A cart item belongs to a product
        CartItem.belongsTo(models.product, {
            foreignKey: 'productId',
            as: 'product',
            onDelete: 'CASCADE'
        });
    };

    // Hooks
    // Ensure price and totalPrice are set before validation so notNull checks pass
    CartItem.beforeValidate(async (cartItem, options) => {
        const { product } = require('../models');
        try {
            if (!cartItem.price) {
                const productData = await product.findByPk(cartItem.productId, {
                    attributes: ['price']
                });
                cartItem.price = (productData && productData.price) ? productData.price : 0;
            }

            // Ensure quantity has a sensible default
            if (!cartItem.quantity) cartItem.quantity = 1;

            // Calculate totalPrice before validation
            cartItem.totalPrice = Number(cartItem.quantity) * Number(cartItem.price || 0);
        } catch (e) {
            // In case of any error, ensure numeric defaults to avoid validation blocking
            if (!cartItem.price) cartItem.price = 0;
            if (!cartItem.quantity) cartItem.quantity = 1;
            cartItem.totalPrice = Number(cartItem.quantity) * Number(cartItem.price);
        }
    });

    CartItem.beforeCreate(async (cartItem, options) => {
        // Fetch product data and create snapshot
        const { product } = require('../models');
        const productData = await product.findByPk(cartItem.productId, {
            attributes: [
                'product_id', 'part_number', 'short_description', 'image', 
                'price', 'condition', 'sub_condition', 'status'
            ]
        });
        
        if (productData) {
            cartItem.productSnapshot = {
                product_id: productData.product_id,
                part_number: productData.part_number,
                short_description: productData.short_description,
                image: productData.image,
                condition: productData.condition,
                sub_condition: productData.sub_condition,
                status: productData.status,
                addedAt: new Date()
            };
            // If price wasn't set earlier, use product price
            if (!cartItem.price && productData.price) {
                cartItem.price = productData.price;
                cartItem.totalPrice = Number(cartItem.quantity || 1) * Number(cartItem.price);
            }
        }
    });

    // Instance methods
    CartItem.prototype.updateQuantity = async function(newQuantity) {
        if (newQuantity < 1) {
            throw new Error('Quantity must be at least 1');
        }
        if (newQuantity > 999) {
            throw new Error('Quantity cannot exceed 999');
        }
        
        this.quantity = newQuantity;
        this.totalPrice = this.quantity * this.price;
        await this.save();
        
        return this;
    };

    CartItem.prototype.increaseQuantity = async function(amount = 1) {
        const newQuantity = this.quantity + amount;
        return await this.updateQuantity(newQuantity);
    };

    CartItem.prototype.decreaseQuantity = async function(amount = 1) {
        const newQuantity = this.quantity - amount;
        if (newQuantity <= 0) {
            await this.destroy();
            return null;
        }
        return await this.updateQuantity(newQuantity);
    };

    CartItem.prototype.getProductData = function() {
        return this.productSnapshot || {};
    };

    return CartItem;
};
