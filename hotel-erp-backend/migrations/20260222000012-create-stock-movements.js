'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StockMovements', {
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
      type: {
        type:      Sequelize.ENUM('IN', 'OUT'),
        allowNull: false,
      },
      reference: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      createdAt: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('StockMovements', ['itemId'], {
      name: 'stock_movements_item_id_index',
    });

    await queryInterface.addIndex('StockMovements', ['type'], {
      name: 'stock_movements_type_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StockMovements');
  },
};

