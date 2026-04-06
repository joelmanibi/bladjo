'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Floors', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      buildingId: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'Buildings', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'CASCADE',
      },
      floorNumber: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      label: {
        type:      Sequelize.STRING(20),
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

    // Index for fast lookup of floors by building
    await queryInterface.addIndex('Floors', ['buildingId'], {
      name: 'floors_buildingId_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Floors', 'floors_buildingId_idx');
    await queryInterface.dropTable('Floors');
  },
};

