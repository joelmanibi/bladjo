'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rendre name nullable (on utilise désormais firstname + lastname)
    await queryInterface.changeColumn('Tenants', 'name', {
      type:      Sequelize.STRING(100),
      allowNull: true,
    });

    // Ajouter firstname
    await queryInterface.addColumn('Tenants', 'firstname', {
      type:      Sequelize.STRING(100),
      allowNull: true,
      after:     'id',
    });

    // Ajouter lastname
    await queryInterface.addColumn('Tenants', 'lastname', {
      type:      Sequelize.STRING(100),
      allowNull: true,
      after:     'firstname',
    });

    // Ajouter identityNumber (numéro de pièce d'identité)
    await queryInterface.addColumn('Tenants', 'identityNumber', {
      type:      Sequelize.STRING(100),
      allowNull: true,
      after:     'email',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tenants', 'firstname');
    await queryInterface.removeColumn('Tenants', 'lastname');
    await queryInterface.removeColumn('Tenants', 'identityNumber');

    // Rétablir name comme obligatoire
    await queryInterface.changeColumn('Tenants', 'name', {
      type:      Sequelize.STRING(100),
      allowNull: false,
    });
  },
};

