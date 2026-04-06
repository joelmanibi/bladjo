'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PurchaseRequests', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      itemId: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'Items', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'RESTRICT',
      },
      quantity: {
        type:      Sequelize.INTEGER,
        allowNull: false,
      },
      unitPrice: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      totalPrice: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type:         Sequelize.ENUM('PENDING', 'APPROVED', 'ORDERED', 'DELIVERED'),
        allowNull:    false,
        defaultValue: 'PENDING',
      },
      receiptImage: {
        type:      Sequelize.STRING(500),
        allowNull: true,
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

    await queryInterface.addIndex('PurchaseRequests', ['itemId'], {
      name: 'purchase_requests_item_id_index',
    });

    await queryInterface.addIndex('PurchaseRequests', ['status'], {
      name: 'purchase_requests_status_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PurchaseRequests');
  },
};

