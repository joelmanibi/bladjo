'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Halls', 'images', {
      type: Sequelize.JSON,
      allowNull: true,
      after: 'description',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Halls', 'images');
  },
};