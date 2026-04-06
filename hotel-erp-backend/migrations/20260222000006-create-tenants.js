'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tenants', {
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
      phone: {
        type:      Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
        type:      Sequelize.STRING(255),
        allowNull: false,
        unique:    true,
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

    await queryInterface.addIndex('Tenants', ['email'], {
      unique: true,
      name:   'tenants_email_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Tenants', 'tenants_email_unique');
    await queryInterface.dropTable('Tenants');
  },
};

