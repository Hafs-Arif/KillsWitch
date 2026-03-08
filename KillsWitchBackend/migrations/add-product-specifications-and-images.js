'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new specification columns to products table
    await queryInterface.addColumn('products', 'product_model', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'motherboard', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'material', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'front_ports', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'gpu_length', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'cpu_height', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'hdd_support', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'ssd_support', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'expansion_slots', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'case_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'water_cooling_support', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'case_fan_support', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'carton_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'loading_capacity', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Pump specs
    await queryInterface.addColumn('products', 'pump_parameter', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'pump_bearing', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'pump_speed', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'pump_interface', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'pump_noise', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'tdp', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'pipe_length_material', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'light_effect', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'drainage_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Fan specs
    await queryInterface.addColumn('products', 'fan_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_speed', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_voltage', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_interface', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_airflow', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_wind_pressure', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_noise', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_bearing_type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_power', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'fan_rated_voltage', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Keyboard specs
    await queryInterface.addColumn('products', 'axis', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'number_of_keys', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'weight', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'carton_weight', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'package_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'carton_size_kb', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'keycap_technology', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'wire_length', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'lighting_style', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'body_material', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Mouse specs
    await queryInterface.addColumn('products', 'dpi', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'return_rate', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'engine_solution', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'surface_technology', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Packaging & Customization
    await queryInterface.addColumn('products', 'package', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'packing', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'moq_customization', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('products', 'customization_options', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Create ProductImages table
    await queryInterface.createTable('ProductImages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop ProductImages table
    await queryInterface.dropTable('ProductImages');

    // Remove all the added columns
    const columnsToRemove = [
      'product_model', 'motherboard', 'material', 'front_ports', 'gpu_length',
      'cpu_height', 'hdd_support', 'ssd_support', 'expansion_slots', 'case_size',
      'water_cooling_support', 'case_fan_support', 'carton_size', 'loading_capacity',
      'pump_parameter', 'pump_bearing', 'pump_speed', 'pump_interface', 'pump_noise',
      'tdp', 'pipe_length_material', 'light_effect', 'drainage_size',
      'fan_size', 'fan_speed', 'fan_voltage', 'fan_interface', 'fan_airflow',
      'fan_wind_pressure', 'fan_noise', 'fan_bearing_type', 'fan_power', 'fan_rated_voltage',
      'axis', 'number_of_keys', 'weight', 'carton_weight', 'package_size',
      'carton_size_kb', 'keycap_technology', 'wire_length', 'lighting_style', 'body_material',
      'dpi', 'return_rate', 'engine_solution', 'surface_technology',
      'package', 'packing', 'moq_customization', 'customization_options'
    ];

    for (const column of columnsToRemove) {
      await queryInterface.removeColumn('products', column);
    }
  }
};
