'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert(
      'Floors',
      [
        { buildingId: 1, floorNumber: 0, label: 'RDC', createdAt: new Date(), updatedAt: new Date() },
        { buildingId: 1, floorNumber: 1, label: 'R+1', createdAt: new Date(), updatedAt: new Date() },
        { buildingId: 1, floorNumber: 2, label: 'R+2', createdAt: new Date(), updatedAt: new Date() },
        { buildingId: 1, floorNumber: 3, label: 'R+3', createdAt: new Date(), updatedAt: new Date() },
        { buildingId: 1, floorNumber: 4, label: 'R+4', createdAt: new Date(), updatedAt: new Date() },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete(
      'Floors',
      { buildingId: 1 },
      {}
    );
  },
};

