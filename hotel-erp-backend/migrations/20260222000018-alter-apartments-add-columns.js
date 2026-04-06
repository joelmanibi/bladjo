'use strict';

/**
 * Migration: ALTER Apartments table to support the new building/floor schema.
 *
 * Changes applied:
 *  1. Normalize existing status values (FREE/MAINTENANCE → AVAILABLE)
 *  2. Change status ENUM to ('AVAILABLE', 'OCCUPIED')
 *  3. Add new columns: buildingId, floorId, code, rooms, bathrooms, area, rentAmount, description
 *  4. Add FK constraints: buildingId → Buildings, floorId → Floors
 *  5. Add indexes on buildingId and floorId
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Step 1: Normalize legacy status values before changing the ENUM ────────
    await queryInterface.sequelize.query(`
      UPDATE Apartments
      SET status = 'AVAILABLE'
      WHERE status IN ('FREE', 'MAINTENANCE')
    `);

    // ── Step 2: Change ENUM from (FREE, OCCUPIED, MAINTENANCE) → (AVAILABLE, OCCUPIED)
    await queryInterface.changeColumn('Apartments', 'status', {
      type:         Sequelize.ENUM('AVAILABLE', 'OCCUPIED'),
      allowNull:    false,
      defaultValue: 'AVAILABLE',
    });

    // ── Step 3: Add new columns ────────────────────────────────────────────────
    await queryInterface.addColumn('Apartments', 'buildingId', {
      type:      Sequelize.INTEGER,
      allowNull: true,
      after:     'id',
    });

    await queryInterface.addColumn('Apartments', 'floorId', {
      type:      Sequelize.INTEGER,
      allowNull: true,
      after:     'buildingId',
    });

    await queryInterface.addColumn('Apartments', 'code', {
      type:         Sequelize.STRING(20),
      allowNull:    false,
      defaultValue: 'APT',
      after:        'floorId',
    });

    await queryInterface.addColumn('Apartments', 'rooms', {
      type:      Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Apartments', 'bathrooms', {
      type:      Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Apartments', 'area', {
      type:      Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('Apartments', 'rentAmount', {
      type:      Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('Apartments', 'description', {
      type:      Sequelize.TEXT,
      allowNull: true,
    });

    // ── Step 4: Add FK constraints ─────────────────────────────────────────────
    await queryInterface.addConstraint('Apartments', {
      fields:     ['buildingId'],
      type:       'foreign key',
      name:       'apartments_buildingId_fk',
      references: { table: 'Buildings', field: 'id' },
      onDelete:   'SET NULL',
      onUpdate:   'CASCADE',
    });

    await queryInterface.addConstraint('Apartments', {
      fields:     ['floorId'],
      type:       'foreign key',
      name:       'apartments_floorId_fk',
      references: { table: 'Floors', field: 'id' },
      onDelete:   'SET NULL',
      onUpdate:   'CASCADE',
    });

    // ── Step 5: Add indexes ────────────────────────────────────────────────────
    await queryInterface.addIndex('Apartments', ['buildingId'], {
      name: 'apartments_buildingId_idx',
    });

    await queryInterface.addIndex('Apartments', ['floorId'], {
      name: 'apartments_floorId_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('Apartments', 'apartments_buildingId_idx');
    await queryInterface.removeIndex('Apartments', 'apartments_floorId_idx');

    // Remove FK constraints
    await queryInterface.removeConstraint('Apartments', 'apartments_buildingId_fk');
    await queryInterface.removeConstraint('Apartments', 'apartments_floorId_fk');

    // Remove added columns
    await queryInterface.removeColumn('Apartments', 'description');
    await queryInterface.removeColumn('Apartments', 'rentAmount');
    await queryInterface.removeColumn('Apartments', 'area');
    await queryInterface.removeColumn('Apartments', 'bathrooms');
    await queryInterface.removeColumn('Apartments', 'rooms');
    await queryInterface.removeColumn('Apartments', 'code');
    await queryInterface.removeColumn('Apartments', 'floorId');
    await queryInterface.removeColumn('Apartments', 'buildingId');

    // Restore legacy ENUM (rows with AVAILABLE become FREE)
    await queryInterface.changeColumn('Apartments', 'status', {
      type:         Sequelize.ENUM('FREE', 'OCCUPIED', 'MAINTENANCE'),
      allowNull:    false,
      defaultValue: 'FREE',
    });

    await queryInterface.sequelize.query(`
      UPDATE Apartments SET status = 'FREE' WHERE status = 'AVAILABLE'
    `);
  },
};

