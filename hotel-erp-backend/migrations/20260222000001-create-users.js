'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type:      Sequelize.STRING(255),
        allowNull: false,
        unique:    true,
      },
      password: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type:         Sequelize.ENUM('ADMIN', 'OWNER', 'MANAGER', 'RECEPTIONIST', 'ACCOUNTANT'),
        allowNull:    false,
        defaultValue: 'RECEPTIONIST',
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

    // Index on email for fast lookups
    await queryInterface.addIndex('Users', ['email'], {
      unique: true,
      name:   'users_email_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  },
};

