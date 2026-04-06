'use strict';

/**
 * Migration: add `images` JSON column to Apartments table.
 * Stores an array of filenames (e.g. ["apt-123.jpg", "apt-456.jpg"]).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Apartments', 'images', {
      type:         Sequelize.JSON,
      allowNull:    true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Apartments', 'images');
  },
};

