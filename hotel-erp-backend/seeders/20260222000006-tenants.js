'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert(
      'Tenants',
      [
        {
          firstname:      'Jean',
          lastname:       'Kouassi',
          name:           'Jean Kouassi',
          phone:          '0707070707',
          email:          'jean@email.com',
          identityNumber: null,
          createdAt:      new Date(),
          updatedAt:      new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('Tenants', { email: 'jean@email.com' }, {});
  },
};

