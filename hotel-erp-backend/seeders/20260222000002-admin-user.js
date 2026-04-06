'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    // Hash the password with the same cost factor used by the model hooks
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    await queryInterface.bulkInsert(
      'Users',
      [
        {
          name:      'Administrator',
          email:     'admin@hotel-erp.com',
          password:  hashedPassword,
          role:      'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {
        // Skip if the admin already exists (idempotent seed)
        ignoreDuplicates: true,
      }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'admin@hotel-erp.com' }, {});
  },
};

