'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      roomId: {
        type:      Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Rooms',
          key:   'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      customerName: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type:      Sequelize.STRING(20),
        allowNull: false,
      },
      checkInDate: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      checkOutDate: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      totalAmount: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      advanceAmount: {
        type:         Sequelize.DECIMAL(10, 2),
        allowNull:    false,
        defaultValue: 0,
      },
      status: {
        type:         Sequelize.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
        allowNull:    false,
        defaultValue: 'PENDING',
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

    // Index on roomId for fast lookups
    await queryInterface.addIndex('Bookings', ['roomId'], {
      name: 'bookings_room_id_index',
    });

    // Index on status for filtering
    await queryInterface.addIndex('Bookings', ['status'], {
      name: 'bookings_status_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bookings');
  },
};

