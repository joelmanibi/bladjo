'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rooms', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      roomNumber: {
        type:      Sequelize.STRING(20),
        allowNull: false,
        unique:    true,
      },
      type: {
        type:      Sequelize.STRING(50),
        allowNull: false,
      },
      price: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type:         Sequelize.ENUM('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'),
        allowNull:    false,
        defaultValue: 'AVAILABLE',
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

    // Unique index on roomNumber (belt-and-suspenders in addition to the unique constraint)
    await queryInterface.addIndex('Rooms', ['roomNumber'], {
      unique: true,
      name:   'rooms_room_number_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Rooms', 'rooms_room_number_unique');
    await queryInterface.dropTable('Rooms');
  },
};

