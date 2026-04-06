'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Rooms', 'description', {
      type:      Sequelize.TEXT,
      allowNull: true,
      after:     'status',
    });

    await queryInterface.addColumn('Rooms', 'imageUrl', {
      type:      Sequelize.STRING(500),
      allowNull: true,
      after:     'description',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Rooms', 'description');
    await queryInterface.removeColumn('Rooms', 'imageUrl');
  },
};

