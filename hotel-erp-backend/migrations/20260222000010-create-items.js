'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Items', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      category: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      quantity: {
        type:         Sequelize.INTEGER,
        allowNull:    false,
        defaultValue: 0,
      },
      unitPrice: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      createdAt: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
    });

    // Index for filtering by category
    await queryInterface.addIndex('Items', ['category'], {
      name: 'items_category_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Items');
  },
};

