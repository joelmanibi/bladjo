'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('HallBookings', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      hallId: {
        type:      Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Halls', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'RESTRICT',
      },
      customerName: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type:      Sequelize.STRING(20),
        allowNull: false,
      },
      eventDate: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      advanceAmount: {
        type:         Sequelize.DECIMAL(10, 2),
        allowNull:    false,
        defaultValue: 0,
      },
      totalAmount: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type:         Sequelize.ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
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

    // Index for fast lookups by hall
    await queryInterface.addIndex('HallBookings', ['hallId'], {
      name: 'hall_bookings_hall_id_index',
    });

    // Index for filtering by status
    await queryInterface.addIndex('HallBookings', ['status'], {
      name: 'hall_bookings_status_index',
    });

    // Index for filtering by date
    await queryInterface.addIndex('HallBookings', ['eventDate'], {
      name: 'hall_bookings_event_date_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('HallBookings');
  },
};

