'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('HallBookings', 'startDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'eventDate',
    });

    await queryInterface.addColumn('HallBookings', 'endDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'startDate',
    });

    await queryInterface.sequelize.query(`
      UPDATE \`HallBookings\`
      SET \`startDate\` = COALESCE(\`startDate\`, \`eventDate\`),
          \`endDate\`   = COALESCE(\`endDate\`, \`eventDate\`)
    `);

    await queryInterface.changeColumn('HallBookings', 'startDate', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    await queryInterface.changeColumn('HallBookings', 'endDate', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('HallBookings', 'endDate');
    await queryInterface.removeColumn('HallBookings', 'startDate');
  },
};