const { brandcategory } = require(".");

module.exports = (sequelize, DataTypes) => {
    const product = sequelize.define('product', {
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        part_number: {
            type: DataTypes.STRING,
        },
        long_description: {
            type: DataTypes.TEXT,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        condition: {
            type: DataTypes.STRING,
        },
        sub_condition: {
            type: DataTypes.STRING,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        sale_price: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        video_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
        },
        short_description: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false 
        },
        brandcategoryId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        // ======================================================
        // 🔹 Extra fields from your product specification sheets
        // ======================================================

        // Case specs
        product_model: { type: DataTypes.STRING },
        motherboard: { type: DataTypes.STRING },
        material: { type: DataTypes.STRING },
        front_ports: { type: DataTypes.TEXT },
        gpu_length: { type: DataTypes.STRING },
        cpu_height: { type: DataTypes.STRING },
        hdd_support: { type: DataTypes.STRING },
        ssd_support: { type: DataTypes.STRING },
        expansion_slots: { type: DataTypes.STRING },
        case_size: { type: DataTypes.STRING },
        water_cooling_support: { type: DataTypes.STRING },
        case_fan_support: { type: DataTypes.STRING },
        carton_size: { type: DataTypes.STRING },
        loading_capacity: { type: DataTypes.STRING },

        // Pump specs
        pump_parameter: { type: DataTypes.TEXT },
        pump_bearing: { type: DataTypes.STRING },
        pump_speed: { type: DataTypes.STRING },
        pump_interface: { type: DataTypes.STRING },
        pump_noise: { type: DataTypes.STRING },
        tdp: { type: DataTypes.STRING },
        pipe_length_material: { type: DataTypes.STRING },
        light_effect: { type: DataTypes.STRING },
        drainage_size: { type: DataTypes.STRING },

        // Fan specs
        fan_size: { type: DataTypes.STRING },
        fan_speed: { type: DataTypes.STRING },
        fan_voltage: { type: DataTypes.STRING },
        fan_interface: { type: DataTypes.STRING },
        fan_airflow: { type: DataTypes.STRING },
        fan_wind_pressure: { type: DataTypes.STRING },
        fan_noise: { type: DataTypes.STRING },
        fan_bearing_type: { type: DataTypes.STRING },
        fan_power: { type: DataTypes.STRING },
        fan_rated_voltage: { type: DataTypes.STRING },

        // Keyboard specs
        axis: { type: DataTypes.STRING },
        number_of_keys: { type: DataTypes.STRING },
        weight: { type: DataTypes.STRING },
        carton_weight: { type: DataTypes.STRING },
        package_size: { type: DataTypes.STRING },
        carton_size_kb: { type: DataTypes.STRING },
        keycap_technology: { type: DataTypes.STRING },
        wire_length: { type: DataTypes.STRING },
        lighting_style: { type: DataTypes.STRING },
        body_material: { type: DataTypes.STRING },

        // Mouse specs
        dpi: { type: DataTypes.STRING },
        return_rate: { type: DataTypes.STRING },
        engine_solution: { type: DataTypes.STRING },
        surface_technology: { type: DataTypes.STRING },

        // Packaging & Customization
        package: { type: DataTypes.STRING },
        packing: { type: DataTypes.STRING },
        moq_customization: { type: DataTypes.STRING },
        customization_options: { type: DataTypes.TEXT },
    });

    product.associate = (models) => {
        product.belongsTo(models.brandcategory, {
            foreignKey: 'brandcategoryId',
            as: 'brandcategory'
        });

        product.hasMany(models.OrderItem, {
            foreignKey: 'productId',
            as: 'orderItem'
        });

        // 🔹 Multiple images association
        product.hasMany(models.ProductImage, {
            foreignKey: 'productId',
            as: 'images',
            onDelete: 'CASCADE'
        });

        // 🔹 Reviews association
        product.hasMany(models.Review, {
            foreignKey: 'productId',
            as: 'reviews',
            onDelete: 'CASCADE'
        });
    };

    return product;
};