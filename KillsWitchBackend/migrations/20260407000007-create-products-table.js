'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      product_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      part_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      long_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      condition: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sub_condition: {
        type: Sequelize.STRING,
        allowNull: true
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      sale_price: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      video_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      short_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      brandcategoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'brandcategory',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      product_model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      motherboard: {
        type: Sequelize.STRING,
        allowNull: true
      },
      material: {
        type: Sequelize.STRING,
        allowNull: true
      },
      front_ports: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      gpu_length: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cpu_height: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hdd_support: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ssd_support: {
        type: Sequelize.STRING,
        allowNull: true
      },
      expansion_slots: {
        type: Sequelize.STRING,
        allowNull: true
      },
      case_size: {
        type: Sequelize.STRING,
        allowNull: true
      },
      water_cooling_support: {
        type: Sequelize.STRING,
        allowNull: true
      },
      case_fan_support: {
        type: Sequelize.STRING,
        allowNull: true
      },
      carton_size: {
        type: Sequelize.STRING,
        allowNull: true
      },
      loading_capacity: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pump_parameter: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      pump_bearing: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pump_speed: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pump_interface: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pump_noise: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tdp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pipe_length_material: {
        type: Sequelize.STRING,
        allowNull: true
      },
      light_effect: {
        type: Sequelize.STRING,
        allowNull: true
      },
      drainage_size: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_size: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_speed: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_voltage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_interface: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_airflow: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_wind_pressure: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_noise: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_bearing_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_power: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fan_rated_voltage: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('products');
  }
};
