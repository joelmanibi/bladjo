'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert(
      'Buildings',
      [
        {
          name:           'IM1',
          address:        'Rue du Commerce, Plateau',
          city:           'Abidjan',
          country:        "Côte d'Ivoire",
          numberOfFloors: 4,
          description:    "Immeuble R+4 situé au Plateau, quartier d'affaires d'Abidjan.",
          createdAt:      new Date(),
          updatedAt:      new Date(),
        },
        {
          name:           'IM2',
          address:        'Avenue Houphouët-Boigny, Cocody',
          city:           'Cocody',
          country:        "Côte d'Ivoire",
          numberOfFloors: 3,
          description:    'Immeuble R+3 situé à Cocody, quartier résidentiel et diplomatique.',
          createdAt:      new Date(),
          updatedAt:      new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, _Sequelize) {
    const { Op } = require('sequelize');
    await queryInterface.bulkDelete(
      'Buildings',
      { name: { [Op.in]: ['IM1', 'IM2'] } },
      {}
    );
  },
};

