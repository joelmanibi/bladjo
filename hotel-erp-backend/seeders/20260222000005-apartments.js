'use strict';

/**
 * Seeder: Insert example apartment AP1.
 *
 * Prerequisites (seeders must run in order):
 *   1. 20260222000003-buildings.js  → IM1 must exist
 *   2. 20260222000004-floors.js     → R+3 for IM1 must exist
 *   3. 20260222000018-alter-apartments-add-columns.js migration must be applied
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, _Sequelize) {
    // ── Resolve foreign keys dynamically to avoid hard-coded id assumptions ────
    const [buildings] = await queryInterface.sequelize.query(
      "SELECT id FROM Buildings WHERE name = 'IM1' LIMIT 1"
    );

    if (!buildings.length) {
      console.warn('[Seeder] IM1 building not found — skipping apartments seeder');
      return;
    }

    const buildingId = buildings[0].id;

    const [floors] = await queryInterface.sequelize.query(
      `SELECT id FROM Floors WHERE label = 'R+3' AND buildingId = ${buildingId} LIMIT 1`
    );

    if (!floors.length) {
      console.warn('[Seeder] R+3 floor not found for IM1 — skipping apartments seeder');
      return;
    }

    const floorId = floors[0].id;

    // ── Insert AP1 ─────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert(
      'Apartments',
      [
        {
          buildingId,
          floorId,
          code:        'AP1',
          rooms:       3,
          bathrooms:   2,
          area:        120,
          rentAmount:  300000.00,
          status:      'AVAILABLE',
          description: 'Appartement 3 pièces avec 2 salles de bain, 120m², situé au R+3 de l\'immeuble IM1.',
          createdAt:   new Date(),
          updatedAt:   new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete(
      'Apartments',
      { code: 'AP1' },
      {}
    );
  },
};

