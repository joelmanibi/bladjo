'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Rooms', 'images', {
      type:      Sequelize.JSON,
      allowNull: true,
      after:     'imageUrl',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Rooms', 'images');
  },
};

