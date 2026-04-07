'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get existing columns
    const table = await queryInterface.describeTable('products');
    
    // Helper function to add column safely
    const addColumnIfNotExists = async (columnName, definition) => {
      if (!table[columnName]) {
        await queryInterface.addColumn('products', columnName, definition);
      }
    };

    // Add new specification columns to products table
    await addColumnIfNotExists('product_model', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('motherboard', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('material', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('front_ports', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await addColumnIfNotExists('gpu_length', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('cpu_height', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('hdd_support', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('ssd_support', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('expansion_slots', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('case_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('water_cooling_support', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('case_fan_support', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('carton_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('loading_capacity', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Pump specs
    await addColumnIfNotExists('pump_parameter', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await addColumnIfNotExists('pump_bearing', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('pump_speed', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('pump_interface', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('pump_noise', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('tdp', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('pipe_length_material', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('light_effect', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('drainage_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Fan specs
    await addColumnIfNotExists('fan_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_speed', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_voltage', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_interface', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_airflow', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_wind_pressure', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_noise', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_bearing_type', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_power', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('fan_rated_voltage', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Keyboard specs
    await addColumnIfNotExists('axis', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('number_of_keys', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('weight', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('carton_weight', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('package_size', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('carton_size_kb', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('keycap_technology', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('wire_length', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('lighting_style', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('body_material', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Mouse specs
    await addColumnIfNotExists('dpi', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('return_rate', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('engine_solution', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('surface_technology', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Packaging & Customization
    await addColumnIfNotExists('package', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('packing', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('moq_customization', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await addColumnIfNotExists('customization_options', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Create ProductImages table
    try {
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
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('products');
    
    // Drop ProductImages table if it exists
    try {
      await queryInterface.dropTable('ProductImages');
    } catch (error) {
      // Table might not exist
    }

    // Remove all the added columns if they exist
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
      if (table[column]) {
        try {
          await queryInterface.removeColumn('products', column);
        } catch (error) {
          // Column might not exist
        }
      }
    }
  }
};
